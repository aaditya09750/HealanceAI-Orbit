import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <motion.footer
      className="mt-6 pb-2"
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5 }}
    >
      <div className="container-shell">
        <div className="rounded-[1.3rem] bg-[#050b3f] px-4 py-5 text-white md:px-5 lg:px-6">
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: 0.06 }}
            >
              <img src="/assets/images/footer-logo.svg" alt="Footer Logo" className="h-7" />
              <p className="mt-3 max-w-xs text-sm leading-snug text-white/95 md:text-base">
                Personalized AI health guidance to help you build better daily habits and reduce
                long-term risk.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: 0.1 }}
            >
              <h3 className="text-lg font-semibold text-white md:text-xl">Platform</h3>
              <ul className="mt-3 space-y-1 text-sm text-white/90 md:text-base">
                <li>
                  <Link
                    to="/doctors"
                    className="group inline-flex items-center gap-3 hover:text-white"
                  >
                    <span className="h-2 w-2 rounded-full bg-[#4f5fd3] transition-all duration-300 group-hover:scale-125 group-hover:shadow-[0_0_0_4px_rgba(79,95,211,0.25)]" />
                    <span>Health Experts</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/services"
                    className="group inline-flex items-center gap-3 hover:text-white"
                  >
                    <span className="h-2 w-2 rounded-full bg-[#4f5fd3] transition-all duration-300 group-hover:scale-125 group-hover:shadow-[0_0_0_4px_rgba(79,95,211,0.25)]" />
                    <span>AI Assessment</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/services"
                    className="group inline-flex items-center gap-3 hover:text-white"
                  >
                    <span className="h-2 w-2 rounded-full bg-[#4f5fd3] transition-all duration-300 group-hover:scale-125 group-hover:shadow-[0_0_0_4px_rgba(79,95,211,0.25)]" />
                    <span>Risk Prediction</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/services"
                    className="group inline-flex items-center gap-3 hover:text-white"
                  >
                    <span className="h-2 w-2 rounded-full bg-[#4f5fd3] transition-all duration-300 group-hover:scale-125 group-hover:shadow-[0_0_0_4px_rgba(79,95,211,0.25)]" />
                    <span>Goal Planner</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/services"
                    className="group inline-flex items-center gap-3 hover:text-white"
                  >
                    <span className="h-2 w-2 rounded-full bg-[#4f5fd3] transition-all duration-300 group-hover:scale-125 group-hover:shadow-[0_0_0_4px_rgba(79,95,211,0.25)]" />
                    <span>Daily Tracking</span>
                  </Link>
                </li>
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: 0.14 }}
            >
              <h3 className="text-lg font-semibold text-white md:text-xl">Quick Links</h3>
              <ul className="mt-3 space-y-1 text-sm text-white/90 md:text-base">
                <li>
                  <Link to="/" className="group inline-flex items-center gap-3 hover:text-white">
                    <span className="h-2 w-2 rounded-full bg-[#4f5fd3] transition-all duration-300 group-hover:scale-125 group-hover:shadow-[0_0_0_4px_rgba(79,95,211,0.25)]" />
                    <span>Home</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/about"
                    className="group inline-flex items-center gap-3 hover:text-white"
                  >
                    <span className="h-2 w-2 rounded-full bg-[#4f5fd3] transition-all duration-300 group-hover:scale-125 group-hover:shadow-[0_0_0_4px_rgba(79,95,211,0.25)]" />
                    <span>About Us</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/faqs"
                    className="group inline-flex items-center gap-3 hover:text-white"
                  >
                    <span className="h-2 w-2 rounded-full bg-[#4f5fd3] transition-all duration-300 group-hover:scale-125 group-hover:shadow-[0_0_0_4px_rgba(79,95,211,0.25)]" />
                    <span>Faqs</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/blog"
                    className="group inline-flex items-center gap-3 hover:text-white"
                  >
                    <span className="h-2 w-2 rounded-full bg-[#4f5fd3] transition-all duration-300 group-hover:scale-125 group-hover:shadow-[0_0_0_4px_rgba(79,95,211,0.25)]" />
                    <span>Blogs</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/projects"
                    className="group inline-flex items-center gap-3 hover:text-white"
                  >
                    <span className="h-2 w-2 rounded-full bg-[#4f5fd3] transition-all duration-300 group-hover:scale-125 group-hover:shadow-[0_0_0_4px_rgba(79,95,211,0.25)]" />
                    <span>Success Stories</span>
                  </Link>
                </li>
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: 0.18 }}
            >
              <h3 className="text-lg font-semibold text-white md:text-xl">Contact Us</h3>
              <ul className="mt-3 space-y-2 text-xs text-white md:text-sm">
                <li className="flex items-center gap-2.5">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#1a246f] text-xs">
                    <i className="fa-regular fa-envelope" />
                  </span>
                  <span>support@healance.ai</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#1a246f] text-xs">
                    <i className="fa-solid fa-phone" />
                  </span>
                  <span>+91 90000 12345</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#1a246f] text-xs">
                    <i className="fa-solid fa-location-dot" />
                  </span>
                  <span>Pune, Maharashtra, India</span>
                </li>
              </ul>
            </motion.div>
          </div>

          <div className="mt-5 grid items-center gap-2.5 lg:grid-cols-[1fr_auto_1fr]">
            <div className="h-px bg-white/20" />
            <div className="flex items-center justify-center gap-2 text-sm">
              <a
                href="#"
                aria-label="Dribbble"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#1a246f] text-white transition hover:bg-[#22308b]"
              >
                <i className="fa-brands fa-dribbble" />
              </a>
              <a
                href="#"
                aria-label="Facebook"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#1a246f] text-white transition hover:bg-[#22308b]"
              >
                <i className="fa-brands fa-facebook-f" />
              </a>
              <a
                href="#"
                aria-label="Instagram"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#1a246f] text-white transition hover:bg-[#22308b]"
              >
                <i className="fa-brands fa-instagram" />
              </a>
            </div>
            <div className="h-px bg-white/20" />
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-white/90 md:text-sm">
            <p>Copyright © 2026 Healance AI. All Rights Reserved.</p>
            <div className="flex items-center gap-2.5">
              <Link to="/" className="hover:text-white">
                Privacy Policy
              </Link>
              <span className="text-[#4753bf]">•</span>
              <Link to="/" className="hover:text-white">
                Terms &amp; Conditions
              </Link>
            </div>
          </div>
        </div>
      </div>
    </motion.footer>
  );
}
