import PageHeader from '../components/PageHeader';
import { blogItems } from '../data/siteData';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function BlogPage() {
  return (
    <>
      <PageHeader
        title="Our Blog"
        subtitle="Health updates, practical tips and clinical insights."
      />
      <section className="section-block">
        <div className="container-shell">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {blogItems.map((post, index) => (
              <motion.article
                key={post.title}
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: index * 0.08 }}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
              >
                <Link to="/blog-single" className="image-anime block">
                  <img src={post.image} alt={post.title} className="h-56 w-full object-cover" />
                </Link>
                <div className="p-6">
                  <div className="mb-3 flex items-center gap-3 text-sm text-slate-500">
                    <span className="font-medium text-brand-600">by joseph</span>
                    <span>{post.meta || post.date}</span>
                  </div>
                  <h2 className="text-xl font-semibold leading-snug text-ink">
                    <Link to="/blog-single">{post.title}</Link>
                  </h2>
                  <Link
                    to="/blog-single"
                    className="mt-4 inline-flex text-sm font-semibold uppercase tracking-wide text-brand-600"
                  >
                    Read more
                  </Link>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
