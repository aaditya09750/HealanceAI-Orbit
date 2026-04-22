import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function SimpleCardGrid({ items, link = '#', showMeta = false }) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 reveal-on-scroll">
      {items.map((item, index) => (
        <motion.article
          key={item.title}
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.4, delay: index * 0.07 }}
          whileHover={{ y: -4 }}
          className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
        >
          {item.image ? (
            <div className="image-anime">
              <img src={item.image} alt={item.title} className="h-52 w-full object-cover" />
            </div>
          ) : null}
          <div className="p-6">
            {showMeta && item.meta ? (
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{item.meta}</p>
            ) : null}
            <h3 className="mt-2 text-xl font-semibold text-ink">{item.title}</h3>
            {item.text ? <p className="mt-3 text-slate-600">{item.text}</p> : null}
            <Link
              to={link}
              className="mt-5 inline-flex text-sm font-semibold uppercase tracking-wide text-brand-600"
            >
              Read More
            </Link>
          </div>
        </motion.article>
      ))}
    </div>
  );
}
