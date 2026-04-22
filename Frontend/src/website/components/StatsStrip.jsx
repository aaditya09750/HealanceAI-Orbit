import { motion } from 'framer-motion';

export default function StatsStrip({ items }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item, index) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.35, delay: index * 0.06 }}
          whileHover={{ y: -3 }}
          className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm"
        >
          <p className="text-3xl font-bold text-brand-600">{item.value}</p>
          <p className="mt-2 text-sm text-slate-600">{item.label}</p>
        </motion.div>
      ))}
    </div>
  );
}
