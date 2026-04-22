import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const features = [
  {
    icon: '/assets/images/icon-about-info-1.svg',
    title: 'Personalized Daily Guidance',
    text: 'Every recommendation adapts to your goals, progress, and daily health behavior.',
  },
  {
    icon: '/assets/images/icon-about-info-2.svg',
    title: 'Expert-Backed AI Logic',
    text: 'Built with medical best practices to keep your wellness decisions practical and safe.',
  },
  {
    icon: '/assets/images/icon-about-info-3.svg',
    title: '24/7 Smart Support',
    text: 'Track and improve your health anytime with real-time insights and alerts.',
  },
];

export default function AboutShowcaseSection({ compact = false }) {
  return (
    <div className="about-showcase-grid">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.45 }}
      >
        <p className="about-showcase-kicker">
          <img src="/assets/images/icon-sub-heading.svg" alt="About" className="h-5 w-5" />
          <span>About Healance AI</span>
        </p>
        <h2 className="about-showcase-title">Your personalized health companion, powered by AI</h2>
        <p className="about-showcase-text">
          We combine behavior tracking, risk prediction, and guided planning so your wellness
          journey stays clear and consistent.
        </p>

        <div className="about-showcase-list">
          {features.map((item) => (
            <div key={item.title} className="about-showcase-item">
              <div className="about-showcase-icon">
                <img src={item.icon} alt={item.title} />
              </div>
              <div>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
            </div>
          ))}
        </div>

        {!compact ? (
          <Link to="/about" className="btn-primary mt-8">
            explore our approach
          </Link>
        ) : null}
      </motion.div>

      <motion.div
        className="about-showcase-visual"
        initial={{ opacity: 0, x: 24 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <div className="about-main-image image-anime">
          <img src="/assets/images/about-img-1.jpg" alt="About" />
        </div>

        <div className="about-overlay-image image-anime">
          <img src="/assets/images/about-img-2.jpg" alt="Video Call" />
          <h3>smart wellness support</h3>
        </div>

        <motion.div
          className="about-hours-card"
          animate={{ x: [0, 14, 0] }}
          transition={{ duration: 3.1, repeat: Infinity, ease: 'easeInOut' }}
        >
          <h3>Platform availability</h3>
          <ul>
            <li>
              <span>AI Dashboard</span> <strong>24/7</strong>
            </li>
            <li>
              <span>Guided Planner</span> <strong>24/7</strong>
            </li>
            <li>
              <span>Expert Support</span> <strong>Mon-Sat</strong>
            </li>
          </ul>
          <figure>
            <i className="fa-solid fa-clock" />
          </figure>
        </motion.div>
      </motion.div>
    </div>
  );
}
