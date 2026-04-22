import { motion } from 'framer-motion';

export default function Topbar() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="hidden bg-brand-600 py-3 text-sm text-white md:block"
    >
      <div className="container-shell flex items-center justify-between">
        <div className="flex items-center gap-5">
          <p className="inline-flex items-center gap-2 border-r border-white/30 pr-5">
            <i className="fa-solid fa-clock" />{' '}
            <span>
              <strong>Support:</strong> 24/7 Personalized Guidance
            </span>
          </p>
          <p className="inline-flex items-center gap-2">
            <i className="fa-solid fa-envelope" />{' '}
            <span>
              <strong>Email:</strong> support@healance.ai
            </span>
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 border-r border-white/30 pr-4 text-base">
            <a href="#" aria-label="Instagram">
              <i className="fa-brands fa-instagram" />
            </a>
            <a href="#" aria-label="Facebook">
              <i className="fa-brands fa-facebook-f" />
            </a>
            <a href="#" aria-label="Dribbble">
              <i className="fa-brands fa-dribbble" />
            </a>
          </div>
          <p>
            <strong>Contact:</strong> +91 90000 12345
          </p>
        </div>
      </div>
    </motion.div>
  );
}
