import { motion } from 'framer-motion';

export default function PageHeader({
  title,
  subtitle,
  background = '/assets/images/page-header-bg.png',
  breadcrumb,
  panelClassName = '',
  titleClassName = '',
  breadcrumbClassName = '',
  subtitleClassName = '',
}) {
  const crumb = title.replace(/^Our\s+/i, '').trim();
  const breadcrumbText =
    Array.isArray(breadcrumb) && breadcrumb.length > 0 ? breadcrumb.join(' / ') : `Home / ${crumb}`;

  return (
    <section className="section-block pt-0">
      <div className="container-shell">
        <div
          className={`page-header-panel ${panelClassName}`.trim()}
          style={{
            backgroundImage: `linear-gradient(rgba(240,241,252,0.95), rgba(240,241,252,0.95)), url(${background})`,
          }}
        >
          <motion.span
            aria-hidden="true"
            className="pointer-events-none absolute left-8 top-8 h-10 w-10 rounded-full bg-brand-600/15"
            animate={{ y: [0, -8, 0], opacity: [0.45, 0.85, 0.45] }}
            transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.span
            aria-hidden="true"
            className="pointer-events-none absolute bottom-10 right-12 h-16 w-16 rounded-full bg-brand-500/15"
            animate={{ y: [0, 10, 0], x: [0, -6, 0], opacity: [0.35, 0.7, 0.35] }}
            transition={{ duration: 4.6, repeat: Infinity, ease: 'easeInOut' }}
          />

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className={`page-header-title ${titleClassName}`.trim()}
          >
            {title}
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.42, delay: 0.1 }}
            className={`page-header-breadcrumb ${breadcrumbClassName}`.trim()}
          >
            {breadcrumbText}
          </motion.div>

          {subtitle ? (
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.16 }}
              className={`page-header-subtitle ${subtitleClassName}`.trim()}
            >
              {subtitle}
            </motion.p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
