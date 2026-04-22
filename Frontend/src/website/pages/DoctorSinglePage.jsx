import PageHeader from '../components/PageHeader';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

const experienceItems = [
  {
    title: 'Graduate Intern - 2013 - 2020',
    text: 'At Institution Name focused on family counseling and conflict resolution techniques.',
  },
  {
    title: 'Licensed Psychologist - 2020 - Present',
    text: 'At Institution Name focused on family counseling and conflict resolution techniques.',
  },
];

const skillItems = [
  { label: 'Psychologist', value: 56 },
  { label: 'Success Case', value: 89 },
  { label: 'Therapy Specialist', value: 85 },
];

const expertiseItems = [
  'Experienced Professionals',
  'Client-Centered Approach',
  'Safe And Confidential Environment',
  'Commitment To Growth',
];

const sectionStagger = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const textReveal = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: 'easeOut' },
  },
};

export default function DoctorSinglePage() {
  const sectionRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });

  const sidebarImageY = useTransform(scrollYProgress, [0, 1], [-20, 20]);
  const contentY = useTransform(scrollYProgress, [0, 1], [14, -14]);

  return (
    <>
      <PageHeader title="Dr. esther howard" breadcrumb={['Home', 'Doctor', 'Dr. Esther Howard']} />

      <section ref={sectionRef} className="section-block">
        <div className="container-shell grid items-start gap-8 lg:grid-cols-[320px_1fr]">
          <motion.aside
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="self-start overflow-hidden rounded-[2rem] bg-[#0b1030] lg:sticky lg:top-28"
          >
            <motion.img
              style={{ y: sidebarImageY }}
              src="/assets/images/team-1.jpg"
              alt="Doctor"
              className="h-[360px] w-full object-cover"
            />
            <div className="bg-[#f0f1fc] p-5 text-[15px] text-[#0b1030]">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="font-semibold">Name:</span>
                  <span className="text-slate-600">Dr. Esther howard</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="font-semibold">Position:</span>
                  <span className="text-slate-600">Psychologist</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="font-semibold">Phone:</span>
                  <span className="text-slate-600">+91- 123 456 7890</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="font-semibold">E-Mail:</span>
                  <span className="text-slate-600">info@domain.com</span>
                </div>
                <div className="flex items-center justify-between pb-1">
                  <span className="font-semibold">Experience:</span>
                  <span className="text-slate-600">16 years</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between px-5 py-4 text-white">
              <span className="font-semibold">Follow Us:</span>
              <div className="flex items-center gap-2">
                <a
                  href="#"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/40 text-sm hover:bg-white hover:text-[#0b1030]"
                >
                  <i className="fa-brands fa-x-twitter" />
                </a>
                <a
                  href="#"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/40 text-sm hover:bg-white hover:text-[#0b1030]"
                >
                  <i className="fa-brands fa-linkedin-in" />
                </a>
                <a
                  href="#"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/40 text-sm hover:bg-white hover:text-[#0b1030]"
                >
                  <i className="fa-brands fa-pinterest-p" />
                </a>
              </div>
            </div>
          </motion.aside>

          <motion.article
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={sectionStagger}
            style={{ y: contentY }}
          >
            <motion.h2
              variants={textReveal}
              className="text-3xl font-bold text-ink sm:text-4xl md:text-5xl"
            >
              Personal biography
            </motion.h2>
            <motion.p variants={textReveal} className="mt-4 text-lg leading-8 text-slate-600">
              Dr. Esther Howard is a highly experienced Psychologist with over 12 years of expertise
              in diagnosing and treating a wide range of conditions. She specializes in advanced
              procedures like cataract surgery, LASIK, and the management of glaucoma and retinal
              disorders. With a deep commitment to patient care, Dr. Carter ensures personalized
              treatment plans tailored to each individual&apos;s needs.
            </motion.p>

            <motion.div variants={textReveal} className="mt-8 grid gap-8 lg:grid-cols-2">
              <div>
                <h3 className="text-3xl font-bold text-ink sm:text-4xl md:text-5xl">
                  My experience
                </h3>
                <div className="mt-4 space-y-6">
                  {experienceItems.map((item) => (
                    <motion.div key={item.title} variants={textReveal}>
                      <h4 className="text-2xl font-semibold text-ink sm:text-[28px]">
                        {item.title}
                      </h4>
                      <p className="mt-2 text-lg leading-8 text-slate-600">{item.text}</p>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-3xl font-bold text-ink sm:text-4xl md:text-5xl">My skills</h3>
                <div className="mt-5 space-y-5">
                  {skillItems.map((skill) => (
                    <motion.div key={skill.label} variants={textReveal}>
                      <div className="mb-2 flex items-center justify-between text-[17px] text-slate-600">
                        <span>{skill.label}</span>
                        <span className="font-semibold">{skill.value}%</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-200">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${skill.value}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.7, delay: 0.1 }}
                          className="h-1.5 rounded-full bg-brand-600"
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>

            <motion.div variants={textReveal} className="mt-8">
              <h3 className="text-3xl font-bold text-ink sm:text-4xl md:text-5xl">
                My expertise area &amp; feature
              </h3>
              <p className="mt-3 text-lg leading-8 text-slate-600">
                Esther specializes in cognitive-behavioral therapy (CBT), trauma recovery, and
                mindfulness techniques, offering tailored support for individuals dealing with
                anxiety, depression, and life transitions.
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {expertiseItems.map((item) => (
                  <motion.div
                    key={item}
                    variants={textReveal}
                    className="flex items-center gap-3 text-[17px] text-slate-700"
                  >
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-[11px] text-white">
                      <i className="fa-solid fa-check" />
                    </span>
                    <span>{item}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              variants={textReveal}
              className="mt-8 rounded-[2rem] bg-[#f0f1fc] p-6 md:p-8"
            >
              <h3 className="text-3xl font-bold text-ink sm:text-4xl md:text-5xl">
                Get in touch with me
              </h3>
              <form className="mt-5 space-y-4">
                <input
                  type="text"
                  placeholder="Enter Your Name"
                  className="w-full rounded-xl border border-transparent bg-white px-4 py-3.5 text-base outline-none focus:border-brand-500"
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <input
                    type="email"
                    placeholder="Enter Your Email"
                    className="w-full rounded-xl border border-transparent bg-white px-4 py-3.5 text-base outline-none focus:border-brand-500"
                  />
                  <input
                    type="text"
                    placeholder="Enter Your Number"
                    className="w-full rounded-xl border border-transparent bg-white px-4 py-3.5 text-base outline-none focus:border-brand-500"
                  />
                </div>
                <textarea
                  rows="4"
                  placeholder="Write Message.."
                  className="w-full rounded-xl border border-transparent bg-white px-4 py-3.5 text-base outline-none focus:border-brand-500"
                />
                <button type="button" className="btn-primary">
                  Submit Now
                </button>
              </form>
            </motion.div>
          </motion.article>
        </div>
      </section>
    </>
  );
}
