import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function CtaBanner({ compact = false }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.45 }}
      className={`${compact ? 'py-7 md:py-9' : 'section-block'} bg-section`}
    >
      <div className="container-shell grid items-center gap-8 md:grid-cols-3">
        <motion.div
          className="image-anime rounded-2xl"
          whileHover={{ y: -3 }}
          transition={{ duration: 0.2 }}
        >
          <img
            src="/assets/images/cta-img-1.png"
            alt="CTA"
            className="mx-auto h-48 object-contain"
          />
        </motion.div>
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.08 }}
        >
          <h2 className="text-3xl font-bold text-ink">Start your personalized AI health journey</h2>
          <p className="mt-3 text-slate-600">
            Set up your profile and get daily, data-driven wellness guidance
          </p>
          <Link to="/book-appointment" className="btn-primary mt-6">
            Get Started
          </Link>
        </motion.div>
        <motion.div
          className="image-anime rounded-2xl"
          whileHover={{ y: -3 }}
          transition={{ duration: 0.2 }}
        >
          <img
            src="/assets/images/cta-img-2.png"
            alt="CTA"
            className="mx-auto h-48 object-contain"
          />
        </motion.div>
      </div>
    </motion.section>
  );
}
