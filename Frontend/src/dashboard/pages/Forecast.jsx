import React, { useState, useEffect, useRef } from 'react';
import {
  CloudSun,
  Wind,
  Droplets,
  Thermometer,
  MapPin,
  RefreshCw,
  Loader2,
  AlertCircle,
  Sun,
  Cloud,
  CloudRain,
  CloudSnow,
  Sunrise,
  Sunset,
  TrendingUp,
  Heart,
  Activity,
  Bike,
  PersonStanding,
} from 'lucide-react';
import axios from 'axios';
import Button from '../../shared/ui/Button';
import DashReveal from '../../shared/ui/DashReveal';
import { API_URL } from '../../constants/config';

const weatherIcons = {
  Sunny: Sun,
  Clear: Sun,
  Clouds: Cloud,
  Rain: CloudRain,
  Snow: CloudSnow,
  default: CloudSun,
};

const activityIcons = {
  'Morning Run': Activity,
  'Afternoon Cycling': Bike,
  'Evening Yoga': PersonStanding,
  'Outdoor Walk': Activity,
  Swimming: Droplets,
  default: Activity,
};

const suitabilityColors = {
  Excellent: 'bg-green-50 border-green-100',
  Perfect: 'bg-blue-50 border-blue-100',
  Good: 'bg-emerald-50 border-emerald-100',
  Moderate: 'bg-yellow-50 border-yellow-100',
  Poor: 'bg-orange-50 border-orange-100',
  'Not Recommended': 'bg-red-50 border-red-100',
};

const suitabilityBadgeColors = {
  Excellent: 'bg-green-200 text-green-800',
  Perfect: 'bg-blue-200 text-blue-800',
  Good: 'bg-emerald-200 text-emerald-800',
  Moderate: 'bg-yellow-200 text-yellow-800',
  Poor: 'bg-orange-200 text-orange-800',
  'Not Recommended': 'bg-red-200 text-red-800',
};

const Forecast = () => {
  const [forecast, setForecast] = useState(null);
  const [weeklyForecast, setWeeklyForecast] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [location, setLocation] = useState({ city: 'Mumbai' });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isManualCitySelected = useRef(false);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (isManualCitySelected.current) return;
          setLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          });
        },
        () => {
          setLocation({ city: 'Mumbai' });
        }
      );
    }
  };

  const fetchForecast = async () => {
    try {
      setIsRefreshing(true);
      setError('');
      const params = location.lat
        ? `lat=${location.lat}&lon=${location.lon}`
        : `city=${location.city}`;

      const response = await axios.get(`${API_URL}/forecast?${params}`, { withCredentials: true });

      if (response.data.success) {
        setForecast(response.data.forecast);
      }
    } catch (err) {
      setForecast(null);
      setError(
        err?.response?.data?.message || 'Unable to load live forecast data. Please try again.'
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const fetchWeeklyForecast = async () => {
    try {
      const params = location.lat
        ? `lat=${location.lat}&lon=${location.lon}`
        : `city=${location.city}`;

      const response = await axios.get(`${API_URL}/forecast/weekly?${params}`, {
        withCredentials: true,
      });

      if (response.data.success) {
        setWeeklyForecast(response.data.forecast);
      }
    } catch (err) {
      setWeeklyForecast([]);
    }
  };

  useEffect(() => {
    getUserLocation();
  }, []);

  useEffect(() => {
    fetchForecast();
    fetchWeeklyForecast();
  }, [location]);

  const handleRefresh = () => {
    fetchForecast();
    fetchWeeklyForecast();
  };

  const handleCityChange = (city) => {
    isManualCitySelected.current = true;
    setLocation({ city });
  };

  const WeatherIcon = forecast
    ? weatherIcons[forecast.condition] || weatherIcons.default
    : CloudSun;

  const formatMetricValue = (value, suffix = '') => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) return 'N/A';
    return `${value}${suffix}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={40} className="animate-spin text-[#506cd7]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-[16px] flex items-center gap-3">
          <AlertCircle size={20} className="text-red-500" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Location Selector */}
      <DashReveal>
        <div className="dash-card-static">
          <h3 className="dash-heading mb-4 text-sm sm:text-base flex items-center gap-2">
            <span
              className="dash-icon-badge dash-icon-badge--gradient-indigo"
              style={{ width: 30, height: 30 }}
            >
              <MapPin size={14} className="text-white" />
            </span>
            Quick Location Select
          </h3>
          <div className="flex flex-wrap gap-2">
            {['Mumbai', 'Delhi', 'Bangalore', 'Pune', 'Chennai', 'Hyderabad', 'Kolkata'].map(
              (city) => {
                const active = location.city === city;
                return (
                  <button
                    key={city}
                    onClick={() => handleCityChange(city)}
                    aria-pressed={active}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                      active
                        ? 'text-white shadow-md'
                        : 'bg-[#f0f1fc] text-[#0b1030] hover:bg-[#e8eaf9]'
                    }`}
                    style={
                      active
                        ? {
                            background: 'linear-gradient(135deg, #506cd7 0%, #0ea5e9 100%)',
                            boxShadow: '0 6px 18px rgba(80, 108, 215, 0.30)',
                          }
                        : undefined
                    }
                  >
                    {city}
                  </button>
                );
              }
            )}
          </div>
        </div>
      </DashReveal>

      {/* Main Weather Card */}
      <DashReveal delay={0.1}>
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-[20px] sm:rounded-[28px] p-5 sm:p-8 text-white shadow-xl shadow-blue-500/20 relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 right-10 w-32 h-32 rounded-full bg-white blur-3xl"></div>
            <div className="absolute bottom-10 left-10 w-24 h-24 rounded-full bg-white blur-2xl"></div>
          </div>

          <div className="relative">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div>
                <h2 className="text-2xl sm:text-3xl font-heading font-bold mb-1">
                  Health Weather Forecast
                </h2>
                <p className="text-sm sm:text-base text-blue-100">
                  Plan your outdoor activities based on air quality and weather.
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <MapPin size={16} className="text-blue-200" />
                  <span className="text-blue-100">
                    {forecast?.location || location.city || 'Your Location'}
                  </span>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="text-left sm:text-right">
                  <div className="flex items-center gap-3 justify-end">
                    <WeatherIcon size={40} className="text-yellow-300" />
                    <p className="text-4xl sm:text-5xl font-heading font-bold">
                      {forecast
                        ? `${forecast.temperature}${forecast.temperatureUnit || '°C'}`
                        : 'N/A'}
                    </p>
                  </div>
                  <p className="text-blue-100 text-lg">{forecast?.condition || 'N/A'}</p>
                </div>
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <RefreshCw size={20} className={isRefreshing ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>

            {/* Weather Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6 sm:mt-8">
              <div className="bg-white/10 backdrop-blur-md p-3 sm:p-4 rounded-xl">
                <div className="flex items-center gap-1.5 sm:gap-2 mb-2 text-blue-100 text-xs sm:text-sm">
                  <Wind size={16} className="flex-shrink-0" /> Air Quality
                </div>
                <p className="text-lg sm:text-xl font-bold">
                  {forecast?.airQuality?.level || 'N/A'} (
                  {formatMetricValue(forecast?.airQuality?.value)})
                </p>
                <p className="text-[10px] sm:text-xs text-blue-200">
                  {forecast?.airQuality?.advice || 'No live data available'}
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-md p-3 sm:p-4 rounded-xl">
                <div className="flex items-center gap-1.5 sm:gap-2 mb-2 text-blue-100 text-xs sm:text-sm">
                  <Droplets size={16} className="flex-shrink-0" /> Humidity
                </div>
                <p className="text-lg sm:text-xl font-bold">
                  {formatMetricValue(forecast?.humidity, '%')}
                </p>
                <p className="text-[10px] sm:text-xs text-blue-200">
                  {forecast?.humidity
                    ? forecast.humidity > 70
                      ? 'High humidity'
                      : 'Stay hydrated'
                    : 'No live data available'}
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-md p-3 sm:p-4 rounded-xl">
                <div className="flex items-center gap-1.5 sm:gap-2 mb-2 text-blue-100 text-xs sm:text-sm">
                  <CloudSun size={16} className="flex-shrink-0" /> UV Index
                </div>
                <p className="text-lg sm:text-xl font-bold">
                  {forecast?.uvIndex?.level || 'N/A'} ({formatMetricValue(forecast?.uvIndex?.value)}
                  )
                </p>
                <p className="text-[10px] sm:text-xs text-blue-200">
                  {forecast?.uvIndex?.advice || 'No live data available'}
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-md p-3 sm:p-4 rounded-xl">
                <div className="flex items-center gap-1.5 sm:gap-2 mb-2 text-blue-100 text-xs sm:text-sm">
                  <Thermometer size={16} className="flex-shrink-0" /> Pollen
                </div>
                <p className="text-lg sm:text-xl font-bold">
                  {forecast?.pollenLevel?.level || 'N/A'}
                </p>
                <p className="text-[10px] sm:text-xs text-blue-200">
                  {forecast?.pollenLevel?.advice || 'No live data available'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </DashReveal>

      {/* Weekly Forecast */}
      {weeklyForecast.length > 0 && (
        <div className="dash-card-static dash-card-accent" style={{ '--accent-stripe': '#0ea5e9' }}>
          <h3 className="dash-heading mb-4 text-sm sm:text-base flex items-center gap-2">
            <span
              className="dash-icon-badge dash-icon-badge--gradient-cyan"
              style={{ width: 30, height: 30 }}
            >
              <TrendingUp size={14} className="text-white" />
            </span>
            7-Day Forecast
          </h3>
          <div className="grid grid-cols-7 gap-2 sm:gap-3">
            {weeklyForecast.map((day, index) => {
              const DayIcon = weatherIcons[day.condition] || weatherIcons.default;
              return (
                <div
                  key={index}
                  className="text-center p-2 sm:p-3 rounded-xl transition-all hover:-translate-y-0.5 border"
                  style={
                    day.isToday
                      ? {
                          background:
                            'linear-gradient(135deg, #f5f7ff 0%, #ffffff 55%, #e0f2fe 100%)',
                          borderColor: '#506cd7',
                          boxShadow: '0 6px 18px rgba(80, 108, 215, 0.18)',
                        }
                      : {
                          background: '#f8f9ff',
                          borderColor: 'transparent',
                        }
                  }
                >
                  <p
                    className={`text-xs sm:text-sm font-semibold ${day.isToday ? 'text-[#506cd7]' : 'text-[#5f697a]'}`}
                  >
                    {day.day}
                  </p>
                  <DayIcon
                    size={20}
                    className={`mx-auto my-2 ${
                      day.condition === 'Sunny' || day.condition === 'Clear'
                        ? 'text-yellow-500'
                        : day.condition === 'Rain'
                          ? 'text-blue-500'
                          : 'text-[#6a7283]'
                    }`}
                  />
                  <p className="text-sm sm:text-lg font-bold text-[#0b1030]">
                    {day.maxTemp ?? day.temp}°
                  </p>
                  <p className="text-[10px] text-[#5f697a]">{day.minTemp ?? day.temp}° min</p>
                  <p className="text-[10px] text-blue-500 font-medium">
                    Rain {day.rainChance ?? day.humidity}%
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Suitability */}
        <div className="dash-card-static dash-card-accent" style={{ '--accent-stripe': '#10b981' }}>
          <h3 className="dash-heading mb-4 text-sm sm:text-base flex items-center gap-2">
            <span
              className="dash-icon-badge dash-icon-badge--gradient-emerald"
              style={{ width: 30, height: 30 }}
            >
              <Activity size={14} className="text-white" />
            </span>
            Activity Suitability
          </h3>
          <div className="space-y-3 sm:space-y-4">
            {(forecast?.activities || []).map((activity, index) => {
              const ActivityIcon = activityIcons[activity.name] || activityIcons.default;
              return (
                <div
                  key={index}
                  className={`flex items-center justify-between p-4 rounded-[16px] border ${
                    suitabilityColors[activity.suitability] || 'bg-[#f0f1fc] border-[#e8eaf9]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <ActivityIcon size={20} className="text-[#5f697a]" />
                    <div>
                      <span className="font-medium text-[#0b1030]">{activity.name}</span>
                      {activity.time && <p className="text-xs text-[#5f697a]">{activity.time}</p>}
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      suitabilityBadgeColors[activity.suitability] || 'bg-[#e8eaf9] text-[#0b1030]'
                    }`}
                  >
                    {activity.suitability}
                  </span>
                </div>
              );
            })}
            {(!forecast?.activities || forecast.activities.length === 0) && (
              <p className="text-sm text-[#5f697a]">
                No live activity insights available right now.
              </p>
            )}
          </div>
        </div>

        {/* Health Tips */}
        <div className="dash-card-static dash-card-accent" style={{ '--accent-stripe': '#e74c4c' }}>
          <h3 className="dash-heading mb-4 text-sm sm:text-base flex items-center gap-2">
            <span
              className="dash-icon-badge dash-icon-badge--gradient-rose"
              style={{ width: 30, height: 30 }}
            >
              <Heart size={14} className="text-white" />
            </span>
            Health Tips for Today
          </h3>
          <div className="space-y-3">
            {(forecast?.healthTips || []).map((tip, index) => (
              <div
                key={index}
                className="flex gap-3 p-3 rounded-xl bg-white border border-[#e8eaf9] hover:border-[#506cd7]/30 transition-colors"
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, #506cd7 0%, #0ea5e9 100%)' }}
                >
                  {index + 1}
                </div>
                <p className="text-sm text-[#5f697a]">{tip}</p>
              </div>
            ))}
            {(!forecast?.healthTips || forecast.healthTips.length === 0) && (
              <p className="text-sm text-[#5f697a]">No live tips available right now.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Forecast;
