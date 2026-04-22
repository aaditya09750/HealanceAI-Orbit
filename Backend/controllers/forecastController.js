const CITY_COORDINATES = {
  mumbai: { lat: 19.076, lon: 72.8777, name: 'Mumbai' },
  delhi: { lat: 28.6139, lon: 77.209, name: 'Delhi' },
  bangalore: { lat: 12.9716, lon: 77.5946, name: 'Bangalore' },
  pune: { lat: 18.5204, lon: 73.8567, name: 'Pune' },
  chennai: { lat: 13.0827, lon: 80.2707, name: 'Chennai' },
  hyderabad: { lat: 17.385, lon: 78.4867, name: 'Hyderabad' },
  kolkata: { lat: 22.5726, lon: 88.3639, name: 'Kolkata' },
};

const OPEN_METEO_BASE_URL = 'https://api.open-meteo.com/v1/forecast';
const OPEN_METEO_GEOCODE_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const OPEN_METEO_AIR_QUALITY_URL = 'https://air-quality-api.open-meteo.com/v1/air-quality';

// @desc    Get health weather forecast
// @route   GET /api/forecast
// @access  Private
export const getHealthForecast = async (req, res) => {
  try {
    const { lat, lon, city } = req.query;

    const locationData = await resolveLocation(lat, lon, city);
    if (!locationData) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid city or coordinates',
      });
    }

    let weatherData = null;
    const weatherApiKey = process.env.WEATHER_API_KEY || process.env.OPENWEATHER_API_KEY;
    const weatherApiBaseUrl =
      process.env.WEATHER_API_BASE_URL || 'https://api.openweathermap.org/data/2.5';
    const weatherUnits = process.env.WEATHER_UNITS || 'metric';

    if (weatherApiKey && !weatherApiKey.startsWith('your-') && locationData) {
      try {
        const query = `lat=${locationData.lat}&lon=${locationData.lon}`;
        const response = await fetch(
          `${weatherApiBaseUrl}/weather?${query}&appid=${weatherApiKey}&units=${weatherUnits}`
        );
        if (response.ok) {
          const data = await response.json();
          weatherData = {
            temperature: data?.main?.temp,
            humidity: data?.main?.humidity,
            condition: normalizeWeatherCondition(data?.weather?.[0]?.main),
            windSpeed: data?.wind?.speed,
            location: data?.name || locationData.name,
          };
        }
      } catch (err) {
        console.log('OpenWeather API error, trying Open-Meteo:', err.message);
      }
    }

    if (!weatherData && locationData) {
      try {
        const response = await fetch(
          `${OPEN_METEO_BASE_URL}?latitude=${locationData.lat}&longitude=${locationData.lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code,uv_index&timezone=auto`
        );

        if (response.ok) {
          const data = await response.json();
          weatherData = {
            temperature: data?.current?.temperature_2m,
            humidity: data?.current?.relative_humidity_2m,
            condition: mapOpenMeteoCodeToCondition(data?.current?.weather_code),
            windSpeed: data?.current?.wind_speed_10m,
            uvIndexValue: data?.current?.uv_index,
            location: locationData.name,
          };
        }
      } catch (err) {
        console.log('Open-Meteo API error, using defaults:', err.message);
      }
    }

    const [airQualityData, pollenData] = await Promise.all([
      fetchAirQuality(locationData.lat, locationData.lon),
      fetchPollen(locationData.lat, locationData.lon),
    ]);

    if (
      !weatherData ||
      weatherData.temperature === null ||
      weatherData.temperature === undefined ||
      weatherData.humidity === null ||
      weatherData.humidity === undefined ||
      weatherData.windSpeed === null ||
      weatherData.windSpeed === undefined
    ) {
      return res.status(502).json({
        success: false,
        message: 'Live weather service is currently unavailable. Please try again shortly.',
      });
    }

    // Build forecast response with live weather data
    const temp = weatherData.temperature;
    const humidity = weatherData.humidity;
    const weather = weatherData.condition || 'Clear';
    const windSpeed = weatherData.windSpeed;

    const airQuality = buildAirQualityFromAqi(airQualityData?.aqi);
    const uvIndex = buildUvIndexFromValue(weatherData?.uvIndexValue);
    const pollenLevel = buildPollenLevelFromValue(pollenData?.pollenIndex);

    // Activity suitability based on weather
    const activities = getActivitySuitability(temp, humidity, airQuality.value, uvIndex.value);

    // Health tips
    const healthTips = generateHealthTips(temp, humidity, airQuality.value, uvIndex.value);

    res.json({
      success: true,
      forecast: {
        temperature: Math.round(temp),
        temperatureUnit: '°C',
        condition: weather,
        humidity,
        windSpeed: Math.round(windSpeed),
        airQuality,
        uvIndex,
        pollenLevel,
        activities,
        healthTips,
        location: weatherData?.location || locationData?.name || city || 'Your Location',
        lastUpdated: new Date(),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Helper functions
function calculateAirQuality(temp, humidity, windSpeed) {
  // Simplified air quality estimation
  let value = 45; // Base AQI
  if (humidity > 80) value += 20;
  if (temp > 35) value += 15;
  if (windSpeed > 20) value -= 10; // Wind disperses pollutants

  value = Math.max(10, Math.min(value, 200));

  let level = 'Good';
  let advice = 'Safe for outdoor activities';
  if (value > 100) {
    level = 'Unhealthy';
    advice = 'Consider indoor activities';
  } else if (value > 50) {
    level = 'Moderate';
    advice = 'Sensitive groups should be cautious';
  }

  return { value, level, advice };
}

function calculateUVIndex(temp, weather) {
  let value = 4; // Default moderate
  if (weather === 'Clear' || weather === 'Sunny') value = 6;
  if (weather === 'Clouds' || weather === 'Overcast') value = 2;
  if (weather === 'Rain') value = 1;
  if (temp > 30) value += 2;

  value = Math.min(value, 11);

  let level = 'Moderate';
  let advice = 'Wear sunscreen';
  if (value <= 2) {
    level = 'Low';
    advice = 'Minimal protection needed';
  } else if (value >= 8) {
    level = 'Very High';
    advice = 'Avoid outdoor activities 10am-4pm';
  } else if (value >= 6) {
    level = 'High';
    advice = 'Wear hat, sunscreen, and sunglasses';
  }

  return { value, level, advice };
}

function calculatePollenLevel(temp, humidity) {
  let level = 'Low';
  let advice = 'No allergies expected';

  if (temp > 20 && temp < 30 && humidity > 40 && humidity < 70) {
    level = 'Moderate';
    advice = 'Take antihistamines if sensitive';
  }
  if (temp > 25 && humidity > 60) {
    level = 'High';
    advice = 'Avoid outdoor activities if allergic';
  }

  return { level, advice };
}

function getActivitySuitability(temp, humidity, aqi, uvIndex) {
  const activities = [];

  // Morning Run
  let runSuitability = 'Excellent';
  if (temp > 35 || aqi > 100) runSuitability = 'Poor';
  else if (temp > 30 || humidity > 80) runSuitability = 'Moderate';
  activities.push({ name: 'Morning Run', suitability: runSuitability, time: '6:00 AM - 8:00 AM' });

  // Afternoon Cycling
  let cycleSuitability = 'Good';
  if (uvIndex > 6 || temp > 35) cycleSuitability = 'Poor';
  else if (temp > 30) cycleSuitability = 'Moderate';
  activities.push({
    name: 'Afternoon Cycling',
    suitability: cycleSuitability,
    time: '4:00 PM - 6:00 PM',
  });

  // Evening Yoga
  activities.push({ name: 'Evening Yoga', suitability: 'Perfect', time: '6:00 PM - 7:30 PM' });

  // Outdoor Walk
  let walkSuitability = 'Good';
  if (temp > 35 || aqi > 100) walkSuitability = 'Not Recommended';
  else if (temp > 30 || humidity > 75) walkSuitability = 'Moderate';
  else if (temp >= 20 && temp <= 28) walkSuitability = 'Excellent';
  activities.push({
    name: 'Outdoor Walk',
    suitability: walkSuitability,
    time: '7:00 AM - 9:00 AM',
  });

  return activities;
}

function generateHealthTips(temp, humidity, aqi, uvIndex) {
  const tips = [];

  if (temp > 30) tips.push('Drink extra water to stay hydrated in high temperatures');
  if (temp < 10) tips.push('Dress in layers to maintain body temperature');
  if (humidity > 70) tips.push('High humidity - take frequent breaks during exercise');
  if (aqi > 50) tips.push('Consider wearing a mask outdoors for air quality protection');
  if (uvIndex > 5) tips.push('Apply SPF 30+ sunscreen before going outdoors');
  tips.push('Stay hydrated - aim for 3 liters of water today');

  return tips;
}

// @desc    Get 7-day health forecast
// @route   GET /api/forecast/weekly
// @access  Private
export const getWeeklyForecast = async (req, res) => {
  try {
    const { lat, lon, city } = req.query;
    const locationData = await resolveLocation(lat, lon, city);

    if (!locationData) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid city or coordinates',
      });
    }

    const response = await fetch(
      `${OPEN_METEO_BASE_URL}?latitude=${locationData.lat}&longitude=${locationData.lon}&daily=temperature_2m_max,temperature_2m_min,weather_code,relative_humidity_2m_mean,precipitation_probability_max,precipitation_sum&timezone=auto&forecast_days=7`
    );

    if (!response.ok) {
      throw new Error('Unable to fetch weekly weather data');
    }

    const data = await response.json();
    const dates = data?.daily?.time || [];
    const maxTemps = data?.daily?.temperature_2m_max || [];
    const minTemps = data?.daily?.temperature_2m_min || [];
    const weatherCodes = data?.daily?.weather_code || [];
    const humidities = data?.daily?.relative_humidity_2m_mean || [];
    const precipitationProbability = data?.daily?.precipitation_probability_max || [];
    const precipitationSum = data?.daily?.precipitation_sum || [];

    const forecast = dates.slice(0, 7).map((date, index) => {
      const maxTemp = Math.round(maxTemps[index] ?? 0);
      const minTemp = Math.round(minTemps[index] ?? 0);
      const avgTemp = Math.round((maxTemp + minTemp) / 2);
      const humidity = Math.round(humidities[index] ?? 55);
      const rainChance = Math.round(precipitationProbability[index] ?? 0);
      const precipitationMm = Number((precipitationSum[index] ?? 0).toFixed(1));

      return {
        day: getDayLabel(date),
        date,
        temp: avgTemp,
        temperature: avgTemp,
        maxTemp,
        minTemp,
        condition: mapOpenMeteoCodeToCondition(weatherCodes[index]),
        humidity,
        rainChance,
        precipitationMm,
        bestActivity: avgTemp > 30 ? 'Indoor Yoga' : 'Morning Run',
        healthScore: calculateHealthScore(avgTemp, humidity),
        isToday: index === 0,
      };
    });

    res.json({ success: true, forecast });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

function mapOpenMeteoCodeToCondition(code) {
  if ([0].includes(code)) return 'Clear';
  if ([1, 2].includes(code)) return 'Sunny';
  if ([3, 45, 48].includes(code)) return 'Clouds';
  if ([51, 53, 55, 56, 57, 61, 63, 65, 80, 81, 82].includes(code)) return 'Rain';
  if ([66, 67, 71, 73, 75, 77, 85, 86].includes(code)) return 'Snow';
  if ([95, 96, 99].includes(code)) return 'Clouds';
  return 'Sunny';
}

function buildAirQualityFromAqi(aqi) {
  if (aqi === null || aqi === undefined || Number.isNaN(Number(aqi))) {
    return {
      value: null,
      level: 'Unavailable',
      advice: 'Air quality data unavailable for this location',
    };
  }

  const value = Math.round(Number(aqi));
  if (value <= 50) return { value, level: 'Good', advice: 'Safe for outdoor activities' };
  if (value <= 100)
    return { value, level: 'Moderate', advice: 'Sensitive groups should be cautious' };
  if (value <= 150)
    return { value, level: 'Unhealthy', advice: 'Reduce prolonged outdoor activity' };
  return { value, level: 'Very Unhealthy', advice: 'Avoid outdoor exertion and wear a mask' };
}

function buildUvIndexFromValue(uvValue) {
  if (uvValue === null || uvValue === undefined || Number.isNaN(Number(uvValue))) {
    return {
      value: null,
      level: 'Unavailable',
      advice: 'UV data unavailable for this location',
    };
  }

  const value = Math.round(Number(uvValue));
  if (value <= 2) return { value, level: 'Low', advice: 'Minimal protection needed' };
  if (value <= 5) return { value, level: 'Moderate', advice: 'Wear sunscreen' };
  if (value <= 7) return { value, level: 'High', advice: 'Use hat, sunscreen, and sunglasses' };
  return { value, level: 'Very High', advice: 'Avoid outdoor activities 10am-4pm' };
}

function buildPollenLevelFromValue(pollenValue) {
  if (pollenValue === null || pollenValue === undefined || Number.isNaN(Number(pollenValue))) {
    return {
      value: null,
      level: 'Unavailable',
      advice: 'Pollen data unavailable for this location',
    };
  }

  const value = Math.round(Number(pollenValue));
  if (value < 40) return { value, level: 'Low', advice: 'No major allergy risk expected' };
  if (value < 80) return { value, level: 'Moderate', advice: 'Take antihistamines if sensitive' };
  return { value, level: 'High', advice: 'Avoid outdoor activities if allergic' };
}

async function fetchAirQuality(lat, lon) {
  try {
    const response = await fetch(
      `${OPEN_METEO_AIR_QUALITY_URL}?latitude=${lat}&longitude=${lon}&current=us_aqi&timezone=auto`
    );

    if (!response.ok) return null;
    const data = await response.json();
    return { aqi: data?.current?.us_aqi };
  } catch {
    return null;
  }
}

async function fetchPollen(lat, lon) {
  try {
    const response = await fetch(
      `${OPEN_METEO_AIR_QUALITY_URL}?latitude=${lat}&longitude=${lon}&hourly=alder_pollen,birch_pollen,grass_pollen,mugwort_pollen,olive_pollen,ragweed_pollen&forecast_days=1&timezone=auto`
    );

    if (!response.ok) return null;

    const data = await response.json();
    const hourly = data?.hourly;
    if (!hourly?.time?.length) return null;

    const first = 0;
    const pollenValues = [
      hourly?.alder_pollen?.[first],
      hourly?.birch_pollen?.[first],
      hourly?.grass_pollen?.[first],
      hourly?.mugwort_pollen?.[first],
      hourly?.olive_pollen?.[first],
      hourly?.ragweed_pollen?.[first],
    ].filter((v) => v !== null && v !== undefined && !Number.isNaN(Number(v)));

    if (!pollenValues.length) return null;

    const pollenIndex = pollenValues.reduce((sum, value) => sum + Number(value), 0);
    return { pollenIndex };
  } catch {
    return null;
  }
}

function normalizeWeatherCondition(condition = '') {
  if (!condition) return 'Sunny';
  if (condition === 'Clear') return 'Clear';
  if (condition === 'Clouds') return 'Clouds';
  if (condition === 'Rain' || condition === 'Drizzle' || condition === 'Thunderstorm')
    return 'Rain';
  if (condition === 'Snow') return 'Snow';
  return 'Sunny';
}

async function resolveLocation(lat, lon, city) {
  const parsedLat = Number(lat);
  const parsedLon = Number(lon);

  if (!Number.isNaN(parsedLat) && !Number.isNaN(parsedLon)) {
    return {
      lat: parsedLat,
      lon: parsedLon,
      name: city || 'Your Location',
    };
  }

  const normalizedCity = (city || 'Mumbai').trim();
  const quickCity = CITY_COORDINATES[normalizedCity.toLowerCase()];
  if (quickCity) {
    return quickCity;
  }

  try {
    const response = await fetch(
      `${OPEN_METEO_GEOCODE_URL}?name=${encodeURIComponent(normalizedCity)}&count=1&language=en&format=json`
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const firstMatch = data?.results?.[0];

    if (!firstMatch) {
      return null;
    }

    return {
      lat: firstMatch.latitude,
      lon: firstMatch.longitude,
      name: firstMatch.name,
    };
  } catch (error) {
    return null;
  }
}

function getDayLabel(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', { weekday: 'short' });
}

function calculateHealthScore(temp, humidity) {
  let score = 90;
  if (temp > 33) score -= 12;
  else if (temp > 30) score -= 8;
  if (humidity > 75) score -= 10;
  else if (humidity > 65) score -= 6;
  return Math.max(55, Math.min(95, score));
}
