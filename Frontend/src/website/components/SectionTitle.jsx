import { motion } from 'framer-motion';

export default function SectionTitle({ kicker, title, text }) {
  return (
    <motion.div
      className="section-title"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.4 }}
    >
      {kicker ? (
        <motion.h3
          className="section-kicker"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.3 }}
        >
          {kicker}
        </motion.h3>
      ) : null}
      <motion.h2
        className="section-heading"
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.35, delay: 0.05 }}
      >
        {title}
      </motion.h2>
      {text ? (
        <motion.p
          className="section-text"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.35, delay: 0.1 }}
        >
          {text}
        </motion.p>
      ) : null}
    </motion.div>
  );
}
