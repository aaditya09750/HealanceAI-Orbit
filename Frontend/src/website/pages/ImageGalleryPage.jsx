import { motion } from 'framer-motion';
import PageHeader from '../components/PageHeader';
import { galleryImages } from '../data/siteData';

export default function ImageGalleryPage() {
  return (
    <>
      <PageHeader
        title="Image Gallery"
        subtitle="Moments from our care environment and patient-first facilities."
      />
      <section className="section-block">
        <div className="container-shell grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {galleryImages.map((image, index) => (
            <motion.article
              key={image}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: 0.38, delay: index * 0.05 }}
              whileHover={{ y: -5 }}
              className="group overflow-hidden rounded-xl"
            >
              <div className="image-anime overflow-hidden rounded-xl">
                <img
                  src={image}
                  alt="Gallery"
                  className="h-64 w-full object-cover transition duration-500 group-hover:scale-105"
                />
              </div>
            </motion.article>
          ))}
        </div>
      </section>
    </>
  );
}
