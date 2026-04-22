import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Blog from '../models/Blog.js';
import { Reward } from '../models/WalkEarn.js';
import Goal from '../models/Goal.js';

dotenv.config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB for seeding');

    // ================== Clear existing data ==================
    await Blog.deleteMany({});
    await Reward.deleteMany({});
    console.log('🗑️  Cleared existing blogs and rewards');

    // ================== Seed Blogs ==================
    // Helper function to generate slug
    const generateSlug = (title) => {
      return title
        .toLowerCase()
        .replace(/[^a-zA-Z0-9 ]/g, '')
        .replace(/\s+/g, '-');
    };

    const blogs = [
      {
        title: 'AI in Healthcare: The Next Frontier',
        slug: generateSlug('AI in Healthcare: The Next Frontier'),
        category: 'Technology',
        image:
          'https://images.unsplash.com/photo-1576091160550-21733e99db29?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
        excerpt:
          'How artificial intelligence is transforming diagnosis, treatment, and patient care globally.',
        content: `Artificial intelligence is revolutionizing healthcare in unprecedented ways. From diagnostic imaging to drug discovery, AI is making healthcare more accessible, efficient, and accurate.\n\nMachine learning algorithms can now detect diseases from medical images with accuracy that rivals or exceeds human experts. Deep learning models analyze X-rays, MRIs, and CT scans to identify conditions like cancer, fractures, and neurological disorders.\n\nNatural language processing (NLP) helps doctors extract insights from electronic health records, clinical notes, and medical literature. This enables better decision-making and personalized treatment plans.\n\nPredictive analytics powered by AI can forecast disease outbreaks, patient readmissions, and treatment outcomes. This proactive approach shifts healthcare from reactive to preventive.\n\nWearable devices with AI capabilities continuously monitor vital signs, alerting both patients and healthcare providers to potential health issues before they become critical.\n\nThe future of AI in healthcare is promising, with developments in robotic surgery, virtual health assistants, and genomic medicine offering even more possibilities for improving patient outcomes.`,
        author: { name: 'Dr. Sarah Chen', designation: 'AI Research Lead' },
        tags: ['AI', 'Healthcare', 'Technology', 'Machine Learning'],
        isPopular: true,
      },
      {
        title: '5 Simple Habits for Heart Health',
        slug: generateSlug('5 Simple Habits for Heart Health'),
        category: 'Wellness',
        image:
          'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
        excerpt:
          'Cardiologists share the most effective daily habits to keep your heart strong and healthy.',
        content: `Heart disease remains the leading cause of death worldwide, but the good news is that many risk factors are within your control. Here are five simple habits recommended by cardiologists:\n\n1. **Move for 30 Minutes Daily**: Regular physical activity strengthens your heart muscle, improves blood circulation, and helps maintain a healthy weight. Even a brisk walk counts!\n\n2. **Eat Heart-Healthy Foods**: Focus on fruits, vegetables, whole grains, lean proteins, and healthy fats. The Mediterranean diet has been consistently shown to reduce cardiovascular risk.\n\n3. **Manage Stress**: Chronic stress raises blood pressure and contributes to heart disease. Practice mindfulness, deep breathing, yoga, or whatever helps you unwind.\n\n4. **Get Quality Sleep**: Aim for 7-9 hours per night. Poor sleep is linked to high blood pressure, obesity, and diabetes - all risk factors for heart disease.\n\n5. **Monitor Your Numbers**: Keep track of your blood pressure, cholesterol levels, and blood sugar. Regular checkups help catch problems early when they're most treatable.`,
        author: { name: 'Dr. James Wilson', designation: 'Cardiologist' },
        tags: ['Heart Health', 'Wellness', 'Cardiology', 'Habits'],
        isPopular: false,
      },
      {
        title: 'Understanding Diabetes Prevention',
        slug: generateSlug('Understanding Diabetes Prevention'),
        category: 'Prevention',
        image:
          'https://images.unsplash.com/photo-1559757609-f3109038c656?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
        excerpt: 'Early warning signs and lifestyle changes that can help prevent Type 2 diabetes.',
        content: `Type 2 diabetes is a growing health concern affecting millions worldwide. However, research shows that lifestyle changes can prevent or delay its onset by up to 58%.\n\n**Early Warning Signs (Prediabetes):**\n- Fasting blood sugar between 100-125 mg/dL\n- Increased thirst and frequent urination\n- Fatigue and blurred vision\n- Dark patches of skin (acanthosis nigricans)\n\n**Prevention Strategies:**\n\n1. **Maintain a Healthy Weight**: Losing just 5-7% of body weight significantly reduces diabetes risk.\n\n2. **Stay Active**: 150 minutes of moderate exercise per week improves insulin sensitivity.\n\n3. **Choose Smart Carbs**: Replace refined carbohydrates with whole grains, legumes, and vegetables.\n\n4. **Increase Fiber Intake**: Aim for 25-30g of fiber daily to improve blood sugar control.\n\n5. **Regular Screening**: If you have risk factors (family history, obesity, age > 45), get screened regularly.`,
        author: { name: 'Emma Thompson, RD', designation: 'Registered Dietitian' },
        tags: ['Diabetes', 'Prevention', 'Diet', 'Health'],
        isPopular: false,
      },
      {
        title: 'The Science of Sleep and Recovery',
        slug: generateSlug('The Science of Sleep and Recovery'),
        category: 'Lifestyle',
        image:
          'https://images.unsplash.com/photo-1541781777621-af13943727dd?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
        excerpt:
          "Why sleep is crucial for your body's recovery and how to improve your sleep quality.",
        content: `Sleep is not just rest - it's an active process crucial for physical and mental recovery. During sleep, your body repairs tissues, consolidates memories, and regulates hormones.\n\n**Sleep Stages:**\n- **NREM Stage 1-2**: Light sleep, body temperature drops\n- **NREM Stage 3**: Deep sleep, physical repair occurs, immune system strengthens\n- **REM Sleep**: Brain processes emotions and memories, dreaming occurs\n\n**Tips for Better Sleep:**\n\n1. **Consistent Schedule**: Go to bed and wake up at the same time daily, even on weekends.\n\n2. **Create a Sleep Sanctuary**: Keep your room dark (65-68°F), quiet, and cool.\n\n3. **Digital Sunset**: Stop screen time 1 hour before bed. Blue light suppresses melatonin production.\n\n4. **Watch Your Diet**: Avoid caffeine after 2 PM and heavy meals within 3 hours of bedtime.\n\n5. **Exercise Timing**: Regular exercise promotes better sleep, but avoid vigorous workouts within 3 hours of bedtime.`,
        author: { name: 'Dr. Michael Ross', designation: 'Sleep Specialist' },
        tags: ['Sleep', 'Recovery', 'Lifestyle', 'Health'],
        isPopular: true,
      },
      {
        title: 'Understanding Your AI Health Score',
        slug: generateSlug('Understanding Your AI Health Score'),
        category: 'Platform Guide',
        image:
          'https://images.unsplash.com/photo-1576091160550-21733e99db29?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
        excerpt:
          'Learn how our algorithms calculate your daily health metrics and what they mean for your longevity.',
        content: `Your Healance Health Score is a comprehensive metric calculated from multiple health data points. Understanding how it works helps you make better health decisions.\n\n**Score Components:**\n- **Physical Activity (25%)**: Steps, active minutes, exercise frequency\n- **Nutrition (20%)**: Calorie intake, water consumption, meal patterns\n- **Sleep Quality (20%)**: Duration, consistency, sleep stages\n- **Vital Signs (20%)**: Heart rate, blood pressure, SpO2\n- **Mental Wellness (15%)**: Mood tracking, stress indicators\n\n**Score Ranges:**\n- 90-100: Excellent - You're in outstanding health\n- 75-89: Good - Minor improvements possible\n- 60-74: Fair - Several areas need attention\n- Below 60: Needs Improvement - Consult with your healthcare provider\n\nThe score updates daily based on your latest data. Track your trends over weeks and months for the most meaningful insights.`,
        author: { name: 'Healance Team', designation: 'Platform Guide' },
        tags: ['Platform', 'Health Score', 'Guide', 'AI'],
        isPopular: true,
      },
      {
        title: '5 Foods to Boost Heart Health',
        slug: generateSlug('5 Foods to Boost Heart Health'),
        category: 'Nutrition',
        image:
          'https://images.unsplash.com/photo-1490645935967-10de6ba17061?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
        excerpt:
          'Cardiologist-approved superfoods that you should include in your diet starting today.',
        content: `A heart-healthy diet is one of the most powerful tools for preventing cardiovascular disease. Here are five superfoods backed by science:\n\n1. **Salmon & Fatty Fish**: Rich in omega-3 fatty acids that reduce inflammation and lower triglycerides. Aim for 2 servings per week.\n\n2. **Berries**: Blueberries, strawberries, and raspberries are packed with antioxidants that protect blood vessels and reduce blood pressure.\n\n3. **Oats & Whole Grains**: Soluble fiber in oats helps lower LDL cholesterol. Start your day with a bowl of oatmeal.\n\n4. **Nuts & Seeds**: Walnuts, almonds, and flaxseeds provide healthy fats, fiber, and plant sterols that benefit heart health.\n\n5. **Leafy Greens**: Spinach, kale, and collard greens are rich in vitamin K, nitrates, and antioxidants that improve arterial function.`,
        author: { name: 'Dr. Priya Sharma', designation: 'Nutritionist' },
        tags: ['Nutrition', 'Heart Health', 'Superfoods', 'Diet'],
        isPopular: false,
      },
    ];

    await Blog.insertMany(blogs);
    console.log(`📝 Seeded ${blogs.length} blog posts`);

    // ================== Seed Rewards ==================
    const rewards = [
      {
        title: 'Amazon Voucher',
        description: '₹500 Amazon Gift Card',
        coinsRequired: 1000,
        category: 'voucher',
        image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=200',
      },
      {
        title: 'Gym Membership',
        description: '1 Month Free Gym Membership',
        coinsRequired: 5000,
        category: 'subscription',
        image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=200',
      },
      {
        title: 'Fitbit Band',
        description: 'Fitbit Inspire 3 Fitness Tracker',
        coinsRequired: 15000,
        category: 'merchandise',
        stock: 10,
        image: 'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=200',
      },
      {
        title: 'Swiggy Voucher',
        description: '₹200 Swiggy Food Voucher',
        coinsRequired: 500,
        category: 'voucher',
        image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=200',
      },
      {
        title: 'Yoga Class',
        description: '5 Free Online Yoga Sessions',
        coinsRequired: 2000,
        category: 'subscription',
        image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=200',
      },
      {
        title: 'Donate to Charity',
        description: 'Donate equivalent to a health NGO',
        coinsRequired: 300,
        category: 'donation',
        image: 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=200',
      },
    ];

    await Reward.insertMany(rewards);
    console.log(`🎁 Seeded ${rewards.length} rewards`);

    // ================== Create Demo User ==================
    const existingUser = await User.findOne({ email: 'demo@healance.ai' });
    if (!existingUser) {
      const demoUser = await User.create({
        name: 'Demo User',
        email: 'demo@healance.ai',
        password: 'demo123456',
        role: 'user',
        coins: 450,
        profile: {
          age: 28,
          gender: 'male',
          height: 175,
          weight: 72,
          bloodGroup: 'O+',
        },
      });

      // Create demo goals
      await Goal.insertMany([
        {
          user: demoUser._id,
          type: 'steps',
          title: 'Daily Steps',
          current: 6500,
          target: 10000,
          unit: 'steps',
        },
        {
          user: demoUser._id,
          type: 'water',
          title: 'Water Intake',
          current: 1.5,
          target: 3,
          unit: 'L',
        },
        {
          user: demoUser._id,
          type: 'calories',
          title: 'Calories Burned',
          current: 1200,
          target: 2200,
          unit: 'kcal',
        },
        {
          user: demoUser._id,
          type: 'sleep',
          title: 'Sleep Duration',
          current: 6.5,
          target: 8,
          unit: 'hrs',
        },
      ]);

      console.log('👤 Demo user created (demo@healance.ai / demo123456)');
    }

    // ================== Create Admin User ==================
    const existingAdmin = await User.findOne({ email: 'admin@healance.ai' });
    if (!existingAdmin) {
      await User.create({
        name: 'Admin User',
        email: 'admin@healance.ai',
        password: 'admin123456',
        role: 'admin',
      });
      console.log('🔐 Admin user created (admin@healance.ai / admin123456)');
    }

    console.log('\n✅ Seed data complete!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error.message);
    process.exit(1);
  }
};

seedData();
