import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import CtaBanner from '../components/CtaBanner';
import AboutShowcaseSection from '../components/AboutShowcaseSection';
import SectionTitle from '../components/SectionTitle';
import TestimonialsSection from '../components/TestimonialsSection';
import { doctorItems } from '../data/siteData';

const approachTabs = ['Our Vision', 'Our Mission', 'Our Value'];

const approachPoints = [
  'Personalized health for every lifestyle.',
  'Wellness powered by practical AI insights.',
  'Human-first guidance at every step.',
  'Building sustainable long-term habits.',
];

const whyChoosePoints = [
  'Your plan adapts daily based on your logged progress.',
  'Simple dashboards keep your priorities clear each day.',
  'Predictive insights help you act before health risks rise.',
  'Built for consistency, not short-term motivation spikes.',
];

const whyChooseCards = [
  {
    icon: '/assets/images/icon-why-choose-1.svg',
    title: '50+ Expert Contributors',
  },
  {
    icon: '/assets/images/icon-why-choose-2.svg',
    title: '24/7 AI Guidance',
  },
  {
    icon: '/assets/images/icon-why-choose-3.svg',
    title: 'Data-Driven Health Team',
  },
];

const workSteps = [
  { no: '01', title: 'Create Account', image: '/assets/images/work-step-img-1.jpg' },
  { no: '02', title: 'Complete Health Profile', image: '/assets/images/work-step-img-2.jpg' },
  { no: '03', title: 'Set Goals & Planner', image: '/assets/images/work-step-img-3.jpg' },
  { no: '04', title: 'Track Daily Progress', image: '/assets/images/work-step-img-4.jpg' },
];

const facilities = [
  {
    iconClass: 'fa-solid fa-laptop-medical',
    title: 'Smart Health Stack',
    text: 'AI models, daily tracking, and intuitive dashboards work together to simplify wellness decisions.',
  },
  {
    iconClass: 'fa-solid fa-user-doctor',
    title: 'Expert-Backed Recommendations',
    text: 'Our recommendations are designed with clinical thinking and practical lifestyle guidance.',
  },
  {
    iconClass: 'fa-solid fa-hand-holding-medical',
    title: 'Habit-First Improvement',
    text: 'Focus on sustainable routines that improve sleep, hydration, activity, and long-term risk trends.',
  },
];

const faqs = [
  'How does Healance personalize my health plan?',
  'How often are recommendations updated?',
  'Is my health data secure?',
  'Can I track water, sleep, and activity daily?',
  'How does Reverse Planner calculate daily targets?',
  'How are risk predictions generated for my profile?',
];

const testimonials = [
  { name: 'Brooklyn Simmons', role: 'Working Professional', image: '/assets/images/author-1.jpg' },
  { name: 'Monika Roy', role: 'Fitness Enthusiast', image: '/assets/images/author-2.jpg' },
  { name: 'Albert Flores', role: 'Wellness Program Member', image: '/assets/images/author-3.jpg' },
];

export default function AboutPage() {
  const [activeTab, setActiveTab] = useState(approachTabs[0]);
  const [activeFaq, setActiveFaq] = useState(0);

  return (
    <>
      <PageHeader title="About Healance AI" />

      <section className="section-block">
        <div className="container-shell">
          <AboutShowcaseSection />
        </div>
      </section>

      <section className="section-block bg-section">
        <div className="container-shell grid items-center gap-10 lg:grid-cols-2">
          <div className="image-anime overflow-hidden rounded-3xl">
            <img
              src="/assets/images/our-approach-img.jpg"
              alt="Our approach"
              className="w-full object-cover"
            />
          </div>

          <div>
            <SectionTitle
              kicker="Our Approach"
              title="Delivering personalized AI health guidance"
              text="We blend data, behavior science, and expert input to create practical daily wellness guidance for each user."
            />

            <div className="mt-6 flex flex-wrap gap-3">
              {approachTabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                    activeTab === tab ? 'bg-brand-600 text-white' : 'bg-white text-slate-700'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="mt-6 grid items-center gap-5 rounded-3xl border border-slate-200 bg-white p-5 sm:grid-cols-2">
              <div className="image-anime overflow-hidden rounded-2xl">
                <img
                  src="/assets/images/mission-image.jpg"
                  alt={activeTab}
                  className="h-full w-full object-cover"
                />
              </div>
              <ul className="space-y-2 text-slate-700">
                {approachPoints.map((point) => (
                  <li key={point} className="flex gap-2">
                    <span className="mt-2 inline-block h-2 w-2 rounded-full bg-brand-600" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="section-block">
        <div className="container-shell">
          <div className="grid gap-8 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <SectionTitle
                kicker="Why Choose Us"
                title="Why members trust Healance every day"
                text="Our focus is measurable progress through personalized plans, proactive alerts, and simple execution."
              />
            </div>
            <div className="lg:col-span-5">
              <ul className="space-y-3 text-slate-700">
                {whyChoosePoints.map((point) => (
                  <li key={point} className="flex gap-2">
                    <span className="mt-2 inline-block h-2 w-2 rounded-full bg-brand-600" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="relative mt-10 overflow-hidden rounded-3xl">
            <div className="image-anime">
              <img src="/assets/images/intro-video-bg.jpg" alt="Video intro" className="w-full" />
            </div>
            <a
              href="https://www.youtube.com/watch?v=Y-x0efG1seA"
              target="_blank"
              rel="noreferrer"
              className="absolute left-1/2 top-1/2 inline-flex -translate-x-1/2 -translate-y-1/2 rounded-full bg-white p-4 shadow-soft"
            >
              <img src="/assets/images/icon-play.svg" alt="Play" className="h-8 w-8" />
            </a>

            <div className="grid gap-3 bg-[#0b1030] p-4 md:grid-cols-3 md:p-6">
              {whyChooseCards.map((item) => (
                <article
                  key={item.title}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white"
                >
                  <img src={item.icon} alt={item.title} className="h-10 w-10" />
                  <h3 className="mt-3 text-lg font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm text-slate-200">
                    Built to make health improvement clear, trackable, and consistent.
                  </p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section-block bg-section">
        <div className="container-shell">
          <div className="home-work-panel">
            <div className="home-work-head">
              <img
                src="/assets/images/icon-sub-heading.svg"
                alt="How We Work"
                className="h-5 w-5"
              />
              <span>How We Work</span>
            </div>
            <h2 className="home-work-title">We work to achieve better health outcomes</h2>
            <p className="home-work-text">
              We convert daily health inputs into personalized actions so your routine keeps moving
              in the right direction.
            </p>

            <div className="work-steps-box">
              {workSteps.map((step, index) => (
                <motion.article
                  key={step.no}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.42, delay: index * 0.08 }}
                  className="work-step-item"
                >
                  <div className="work-step-image">
                    <figure className="image-anime">
                      <img src={step.image} alt={step.title} />
                    </figure>
                    <div className="work-step-no">
                      <h3>{step.no}</h3>
                    </div>
                  </div>

                  <div className="work-step-content">
                    <h3>{step.title}</h3>
                    <p>Complete one guided action at a time and build momentum.</p>
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section-block">
        <div className="container-shell">
          <SectionTitle
            kicker="Health Team"
            title="Experts behind your personalized wellness journey"
            text="Our cross-functional team combines medical insight, product thinking, and AI expertise."
          />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {doctorItems.slice(0, 4).map((doctor, index) => {
              return (
                <motion.article
                  key={doctor.title}
                  initial={{ opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: index * 0.08 }}
                  className="group relative pb-16"
                >
                  <div className="image-anime overflow-hidden rounded-[1.75rem]">
                    <img
                      src={doctor.image}
                      alt={doctor.title}
                      className="h-[20rem] w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  </div>

                  <div className="absolute bottom-0 left-1/2 w-[82%] -translate-x-1/2 rounded-[1.35rem] border border-slate-200 bg-white p-3 text-center text-ink shadow-soft transition-all duration-300 group-hover:-translate-y-1 group-hover:border-brand-600 group-hover:bg-brand-600 group-hover:text-white">
                    <div className="mb-2 flex items-center justify-center gap-3 text-sm text-brand-600 transition-colors duration-300 group-hover:text-white">
                      <a href="#" aria-label="Instagram" className="transition hover:opacity-80">
                        <i className="fa-brands fa-instagram" />
                      </a>
                      <a href="#" aria-label="Facebook" className="transition hover:opacity-80">
                        <i className="fa-brands fa-facebook-f" />
                      </a>
                      <a href="#" aria-label="Dribbble" className="transition hover:opacity-80">
                        <i className="fa-brands fa-dribbble" />
                      </a>
                    </div>
                    <h3 className="text-[1.45rem] font-medium leading-tight text-ink transition-colors duration-300 group-hover:text-white">
                      {doctor.title}
                    </h3>
                    <p className="mt-1 text-base font-normal text-slate-600 transition-colors duration-300 group-hover:text-white/90">
                      {doctor.text}
                    </p>
                  </div>
                </motion.article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section-block bg-section">
        <div className="container-shell">
          <SectionTitle
            kicker="Platform Strengths"
            title="Built for practical, sustainable health progress"
            text="Everything in Healance is designed to help users stay consistent and informed every day."
          />

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {facilities.map((facility, index) => (
              <motion.article
                key={facility.title}
                initial={{ opacity: 0, y: 26 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.35 }}
                transition={{ duration: 0.45, delay: index * 0.08 }}
                className="group rounded-[2rem] bg-white p-7 transition-all duration-300 hover:bg-[#0b1030] hover:shadow-xl"
              >
                <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-2xl text-white transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                  <i className={facility.iconClass} />
                </span>
                <h3 className="mt-5 text-3xl font-semibold text-ink transition-colors duration-300 group-hover:text-white">
                  {facility.title}
                </h3>
                <p className="mt-3 text-lg leading-relaxed text-slate-600 transition-colors duration-300 group-hover:text-slate-200">
                  {facility.text}
                </p>
              </motion.article>
            ))}
          </div>

          <p className="mt-6 text-center text-slate-600">
            <span className="font-semibold text-brand-600">START FREE</span> Begin your personalized
            health journey today.
            <Link to="/contact" className="ml-2 font-semibold text-brand-600">
              Talk to our team
            </Link>
          </p>
        </div>
      </section>

      <div className="pb-6 md:pb-8">
        <CtaBanner compact />
      </div>

      <section className="bg-section pb-12 pt-8 md:pb-16 md:pt-10">
        <div className="container-shell">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.5 }}
            className="relative overflow-hidden rounded-[1.75rem] bg-[#f0f1fc] p-6 md:p-8 lg:p-10"
          >
            <div className="grid gap-10 lg:grid-cols-2">
              <motion.div
                initial={{ opacity: 0, x: -18 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.35 }}
                transition={{ duration: 0.45, delay: 0.1 }}
              >
                <div className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600">
                  <img src="/assets/images/icon-sub-heading.svg" alt="FAQ" className="h-5 w-5" />
                  <span>Frequently Asked Questions</span>
                </div>
                <h2 className="mt-3 max-w-lg text-[2.15rem] font-semibold leading-tight text-ink md:text-[2.7rem]">
                  Helping you understand personalized AI health
                </h2>
                <p className="mt-4 max-w-lg text-base leading-relaxed text-slate-600 md:text-lg">
                  Explore answers to common questions about privacy, tracking, recommendations, and
                  plan personalization.
                </p>

                <div className="mt-8 max-w-md rounded-[1.75rem] bg-white p-5 md:p-6">
                  <div className="flex items-center gap-4">
                    <img
                      src="/assets/images/icon-faq-cta.svg"
                      alt="Support"
                      className="h-11 w-11"
                    />
                    <div>
                      <p className="text-base text-slate-600">
                        We help you stay consistent with your wellness routine
                      </p>
                      <p className="mt-1 text-2xl font-semibold text-ink">24/7 AI Support</p>
                      <p className="mt-1 text-xl text-slate-500">support@healance.ai</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 18 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.35 }}
                transition={{ duration: 0.45, delay: 0.14 }}
              >
                <div className="divide-y divide-slate-300/70 border-t border-slate-300/70">
                  {faqs.map((faq, idx) => {
                    const isOpen = activeFaq === idx;

                    return (
                      <motion.div
                        key={faq}
                        className="py-4"
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.5 }}
                        transition={{ duration: 0.3, delay: idx * 0.05 }}
                      >
                        <motion.button
                          type="button"
                          onClick={() => setActiveFaq(isOpen ? -1 : idx)}
                          className="flex w-full items-center justify-between gap-4 text-left"
                          whileTap={{ scale: 0.995 }}
                        >
                          <span className="text-[1.1rem] font-semibold leading-tight text-ink md:text-[1.3rem]">
                            {faq}
                          </span>
                          <motion.i
                            className={`fa-solid ${isOpen ? 'fa-angle-up' : 'fa-angle-down'} text-xl text-ink`}
                            animate={{ rotate: isOpen ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                          />
                        </motion.button>

                        <AnimatePresence initial={false}>
                          {isOpen ? (
                            <motion.p
                              key="answer"
                              initial={{ height: 0, opacity: 0, marginTop: 0 }}
                              animate={{ height: 'auto', opacity: 1, marginTop: 12 }}
                              exit={{ height: 0, opacity: 0, marginTop: 0 }}
                              transition={{ duration: 0.24, ease: 'easeOut' }}
                              className="max-w-3xl overflow-hidden text-base leading-relaxed text-slate-600 md:text-lg"
                            >
                              Create your profile, set a target, and start logging daily progress.
                              Healance updates recommendations as your data changes.
                            </motion.p>
                          ) : null}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            </div>

            <span className="absolute bottom-20 left-[37%] hidden h-2.5 w-2.5 rounded-full bg-brand-600 lg:block" />
          </motion.div>
        </div>
      </section>

      <TestimonialsSection items={testimonials} sectionClassName="section-block" />
    </>
  );
}
