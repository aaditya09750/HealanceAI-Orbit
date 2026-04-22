import PageHeader from '../components/PageHeader';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

const topicItems = [
  'Implementing Eco-Friendly Healthcare Solutions to Promote Environmental Sustainability',
  'Advancements in Energy-Efficient Technologies to Enhance Healthcare Efficiency',
  'Sustainable Waste Management Practices for Cleaner and Healthier Healthcare Facilities',
  'Embracing Sustainable Treatment Practices for Long-Term Health Benefits and Wellbeing',
  'Similar to how mRNA vaccines have been used for COVID-19, scientists are exploring.',
];

const tagItems = ['Healthcare', 'Wellness', 'Patient Care'];

const revealItem = {
  hidden: { opacity: 0, y: 22, filter: 'blur(4px)' },
  show: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.45, ease: 'easeOut' },
  },
};

const listContainer = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

export default function BlogSinglePage() {
  const sectionRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start end', 'end start'] });
  const heroImageY = useTransform(scrollYProgress, [0, 1], [-18, 18]);
  const articleY = useTransform(scrollYProgress, [0, 1], [16, -16]);

  return (
    <>
      <PageHeader
        title="Research breakthrough in ..."
        breadcrumb={['Home', 'Blog', 'Research Breakthrough in ...']}
        panelClassName="!min-h-[220px] sm:!min-h-[260px] lg:!min-h-[360px]"
        breadcrumbClassName="!mt-5 !px-5 sm:!px-7 !py-2 !text-[12px] sm:!text-[14px] lg:!text-[15px] !font-semibold"
      />

      <section ref={sectionRef} className="section-block pt-7">
        <div className="container-shell max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            whileHover={{ scale: 1.01 }}
            className="overflow-hidden rounded-[2rem]"
          >
            <motion.img
              style={{ y: heroImageY }}
              src="/assets/images/post-1.jpg"
              alt="Doctor consulting a child"
              className="h-[250px] w-full object-cover sm:h-[360px] lg:h-[580px]"
            />
          </motion.div>

          <motion.article
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            transition={{ staggerChildren: 0.12 }}
            style={{ y: articleY }}
            className="mx-auto mt-10 max-w-5xl"
          >
            <motion.p
              variants={revealItem}
              className="text-[16px] leading-8 text-slate-600 md:text-[17px]"
            >
              Selecting the right Healance is a critical decision in ensuring that you receive the
              best possible care and treatment. Whether you&apos;re seeking general healthcare,
              specialized services, or just routine checkups, the right Healance can make all the
              difference in your overall health and well-being. A trustworthy Healance will not only
              offer high-quality medical services but will also create an environment where you feel
              comfortable and confident in your healthcare decisions. This guide provides ten
              essential tips to help you choose the right Healance that aligns with your specific
              needs.
            </motion.p>

            <motion.p
              variants={revealItem}
              className="mt-5 text-[16px] leading-8 text-slate-600 md:text-[17px]"
            >
              From verifying certifications and licenses to checking patient feedback and reviews,
              it&apos;s important to assess all aspects of the Healance&apos;s services.
              Additionally, evaluating the range of treatments offered, the professionalism of the
              staff, the cleanliness of the facility, and the Healance&apos;s commitment to patient
              care are key factors to consider. By taking the time to carefully evaluate each
              Healance, you ensure that you make an informed decision, one that guarantees both your
              peace of mind and the quality of care you deserve.
            </motion.p>

            <motion.blockquote
              variants={revealItem}
              whileHover={{ y: -4, scale: 1.008 }}
              className="mt-8 rounded-3xl bg-[#eceefb] px-6 py-6 text-[#0b1030] md:px-8"
            >
              <motion.p
                animate={{ y: [0, -3, 0] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                className="text-[30px] leading-none text-brand-600"
              >
                ❝
              </motion.p>
              <p className="mt-2 text-[24px] font-semibold leading-[1.36] md:text-[32px]">
                Choosing the right Healance is essential for receiving high-quality healthcare.
                Focus on verifying the Healance&apos;s credentials, checking reviews, and
                considering the services they offer. This will ensure you receive the best care
                tailored to your needs.
              </p>
            </motion.blockquote>

            <motion.p
              variants={revealItem}
              className="mt-8 text-[16px] leading-8 text-slate-600 md:text-[17px]"
            >
              Start by verifying the Healance&apos;s credentials. Ensure they have the necessary
              licenses and certifications to operate legally in your area. Look for Healance with a
              strong reputation and experience in providing the specific services you need. A
              reputable Healance will follow local health regulations, provide high-quality care,
              and cater to your specific healthcare needs.
            </motion.p>

            <motion.h2
              variants={revealItem}
              className="mt-6 text-4xl font-bold leading-tight text-ink md:text-5xl"
            >
              The Future of Sustainable Healthcare Practices
            </motion.h2>

            <motion.p
              variants={revealItem}
              className="mt-5 text-[16px] leading-8 text-slate-600 md:text-[17px]"
            >
              As healthcare continues to evolve, sustainability plays an increasingly vital role in
              shaping the industry. Future healthcare practices will focus on reducing environmental
              impact through eco-friendly solutions, energy-efficient technologies, and waste
              reduction strategies. By adopting sustainable practices, healthcare providers can
              offer high-quality care while promoting a healthier planet. From green building
              designs to sustainable treatment options, the future of healthcare is not only about
              healing individuals but also nurturing the environment for future generations.
            </motion.p>

            <motion.ul
              variants={listContainer}
              className="mt-5 space-y-3 text-[16px] leading-8 text-slate-700 md:text-[17px]"
            >
              {topicItems.map((item) => (
                <motion.li key={item} variants={revealItem} className="flex gap-3">
                  <motion.span
                    className="mt-[11px] h-2 w-2 shrink-0 rounded-full bg-[#5f6574]"
                    animate={{ scale: [1, 1.18, 1] }}
                    transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
                  />
                  <span>{item}</span>
                </motion.li>
              ))}
            </motion.ul>

            <motion.p
              variants={revealItem}
              className="mt-5 text-[16px] leading-8 text-slate-600 md:text-[17px]"
            >
              Sustainable healthcare practices focus on minimizing environmental impact while
              maintaining high-quality care for patients. By incorporating energy-efficient
              technologies, eco-friendly materials, and waste-reduction strategies, healthcare
              providers can significantly lower their carbon footprint. These practices not only
              reduce costs but also contribute to the well-being of both patients and the broader
              community, ensuring a healthier and more sustainable future for all.
            </motion.p>

            <motion.div
              variants={revealItem}
              className="mt-8 flex flex-col gap-5 border-t border-slate-200 pt-7 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-2xl font-semibold text-ink">Tags:</span>
                {tagItems.map((tag) => (
                  <motion.button
                    key={tag}
                    type="button"
                    whileHover={{ y: -2, scale: 1.04 }}
                    whileTap={{ scale: 0.98 }}
                    className="rounded-full bg-brand-600 px-4 py-1.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-brand-700"
                  >
                    {tag}
                  </motion.button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                {['fa-facebook-f', 'fa-linkedin-in', 'fa-instagram', 'fa-x-twitter'].map((icon) => (
                  <motion.a
                    key={icon}
                    href="#"
                    whileHover={{ y: -3, rotate: -6 }}
                    whileTap={{ scale: 0.95 }}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#eceefb] text-brand-600 transition hover:-translate-y-0.5 hover:bg-brand-600 hover:text-white"
                  >
                    <i className={`fa-brands ${icon}`} />
                  </motion.a>
                ))}
              </div>
            </motion.div>
          </motion.article>
        </div>
      </section>
    </>
  );
}
