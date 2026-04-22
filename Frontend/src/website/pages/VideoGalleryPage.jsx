import { motion } from 'framer-motion';
import PageHeader from '../components/PageHeader';

const videos = [
  '/assets/images/video-gallery-img-1.jpg',
  '/assets/images/video-gallery-img-2.jpg',
  '/assets/images/video-gallery-img-3.jpg',
  '/assets/images/video-gallery-img-4.jpg',
  '/assets/images/video-gallery-img-5.jpg',
  '/assets/images/video-gallery-img-6.jpg',
];

export default function VideoGalleryPage() {
  return (
    <>
      <PageHeader
        title="Video Gallery"
        subtitle="Watch our doctors, facilities and treatment stories."
      />
      <section className="section-block">
        <div className="container-shell grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {videos.map((image, index) => (
            <motion.article
              key={image}
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.4, delay: index * 0.07 }}
              whileHover={{ y: -6 }}
              className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
            >
              <div className="image-anime overflow-hidden">
                <img
                  src={image}
                  alt={`Video ${index + 1}`}
                  className="h-56 w-full object-cover transition duration-500 group-hover:scale-105"
                />
              </div>
              <div className="p-4">
                <motion.a
                  href="https://www.youtube.com/watch?v=Y-x0efG1seA"
                  target="_blank"
                  rel="noreferrer"
                  className="btn-primary w-full"
                  whileTap={{ scale: 0.98 }}
                >
                  Play Video
                </motion.a>
              </div>
            </motion.article>
          ))}
        </div>
      </section>
    </>
  );
}
