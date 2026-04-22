import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, animate, motion, useMotionValue, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import SectionTitle from '../components/SectionTitle';
import AboutShowcaseSection from '../components/AboutShowcaseSection';
import TestimonialsSection from '../components/TestimonialsSection';

gsap.registerPlugin(ScrollTrigger);

const services = [
  {
    title: 'AI Health Assessment',
    text: 'Daily health scoring using your activity, hydration, sleep and symptom patterns.',
    image: '/assets/images/service-img-1.jpg',
  },
  {
    title: 'Risk Prediction',
    text: 'Get early alerts for diabetes and heart risk with actionable daily recommendations.',
    image: '/assets/images/service-img-2.jpg',
  },
  {
    title: 'Reverse Health Planner',
    text: 'Set a target date and follow a personalized daily plan to reach your wellness goal.',
    image: '/assets/images/service-img-3.jpg',
  },
];

const doctors = [
  {
    name: 'Dr. Esther Howard',
    specialty: 'Preventive Care Advisor',
    image: '/assets/images/team-1.jpg',
  },
  {
    name: 'Dr. Jenny Wilson',
    specialty: 'Lifestyle Medicine Specialist',
    image: '/assets/images/team-2.jpg',
  },
  {
    name: 'Dr. Kristin Watson',
    specialty: 'Clinical Data Reviewer',
    image: '/assets/images/team-3.jpg',
  },
  {
    name: 'Dr. Arlene McCoy',
    specialty: 'Cardio-Metabolic Expert',
    image: '/assets/images/team-4.jpg',
  },
];

const posts = [
  {
    title: 'How to Build a Daily Health Routine That Sticks',
    date: 'December 3, 2024',
    image: '/assets/images/post-1.jpg',
  },
  {
    title: 'Understanding Your AI Risk Score',
    date: 'December 1, 2024',
    image: '/assets/images/post-2.jpg',
  },
  {
    title: 'Personalized Wellness: One Plan Does Not Fit All',
    date: 'November 30, 2024',
    image: '/assets/images/post-3.jpg',
  },
];

const workSteps = [
  { no: '01', title: 'Create Account', image: '/assets/images/work-step-img-1.jpg' },
  { no: '02', title: 'Complete Health Profile', image: '/assets/images/work-step-img-2.jpg' },
  { no: '03', title: 'Set Goals & Planner', image: '/assets/images/work-step-img-3.jpg' },
  { no: '04', title: 'Track Daily Progress', image: '/assets/images/work-step-img-4.jpg' },
];

const faqs = [
  'How does Healance personalize my health plan?',
  'Is my health data secure on the platform?',
  'Can I use Healance for daily habit tracking?',
  'How often are AI insights and recommendations updated?',
];

const testimonials = [
  { name: 'Brooklyn Simmons', role: 'Working Professional', image: '/assets/images/author-1.jpg' },
  { name: 'Monika Roy', role: 'Fitness Enthusiast', image: '/assets/images/author-2.jpg' },
  { name: 'Albert Flores', role: 'Wellness Program Member', image: '/assets/images/author-3.jpg' },
];

export default function HomePage() {
  const [activeFaq, setActiveFaq] = useState(0);
  const count = useMotionValue(0);
  const roundedCount = useTransform(count, (latest) => Math.round(latest));
  const [displayCount, setDisplayCount] = useState(0);
  const heroRef = useRef(null);
  const servicesRef = useRef(null);

  useEffect(() => {
    const controls = animate(count, 3500, {
      duration: 1.5,
      ease: 'easeOut',
      delay: 0.65,
    });

    const unsubscribe = roundedCount.on('change', (latest) => {
      setDisplayCount(latest);
    });

    return () => {
      controls.stop();
      unsubscribe();
    };
  }, [count, roundedCount]);

  useEffect(() => {
    const hero = heroRef.current;
    const servicesSection = servicesRef.current;

    if (!hero || !servicesSection) {
      return undefined;
    }

    const ctx = gsap.context(() => {
      const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      heroTl
        .from('.gsap-hero-kicker', { y: 18, autoAlpha: 0, duration: 0.45 })
        .from('.gsap-hero-title', { y: 26, autoAlpha: 0, duration: 0.6 }, '-=0.2')
        .from('.gsap-hero-text', { y: 18, autoAlpha: 0, duration: 0.45 }, '-=0.3')
        .from('.gsap-hero-rating', { y: 12, autoAlpha: 0, duration: 0.35 }, '-=0.22')
        .from('.gsap-hero-image-wrap', { x: 32, autoAlpha: 0, duration: 0.6 }, '-=0.5')
        .from('.gsap-hero-doctors', { y: 26, autoAlpha: 0, duration: 0.42 }, '-=0.35')
        .from('.gsap-hero-clients', { y: 24, autoAlpha: 0, duration: 0.42 }, '-=0.28');

      gsap.from('.gsap-service-card', {
        y: 48,
        autoAlpha: 0,
        rotate: 1.6,
        duration: 0.65,
        stagger: 0.12,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: servicesSection,
          start: 'top 78%',
          once: true,
        },
      });
    }, hero);

    return () => {
      ctx.revert();
    };
  }, []);

  return (
    <>
      <section ref={heroRef} className="section-block hero-original">
        <div className="container-shell">
          <div className="hero-original-panel">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <div className="hero-original-content">
                <p className="hero-original-kicker gsap-hero-kicker">
                  <img src="/assets/images/icon-sub-heading.svg" alt="icon" className="h-5 w-5" />
                  <span>AI-Powered Personalized Health</span>
                </p>
                <h1 className="hero-original-title hero-title-fx gsap-hero-title">
                  Your smart daily guide
                  <br />
                  to better health
                </h1>
                <p className="hero-original-text gsap-hero-text">
                  Track habits, predict risks, and follow a personalized wellness plan built around
                  your lifestyle.
                </p>
                <div className="hero-original-actions">
                  <Link to="/book-appointment" className="btn-primary">
                    Start Your Plan
                  </Link>
                  <Link
                    to="/about"
                    className="inline-flex items-center justify-center rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-brand-700"
                  >
                    About Us
                  </Link>
                </div>
                <div className="hero-original-rating gsap-hero-rating">
                  <span>Community Rating 5.0</span>
                  <span>★★★★★</span>
                  <span>based on 500+ wellness journeys</span>
                </div>
              </div>

              <div className="hero-original-image-wrap gsap-hero-image-wrap">
                <div className="hero-original-image image-anime">
                  <img src="/assets/images/hero-img.png" alt="Hero" className="w-full" />
                </div>

                <motion.div
                  className="hero-doctors-card gsap-hero-doctors"
                  animate={{
                    y: [0, -8, 0, 6, 0],
                    x: [0, 3, 0, -3, 0],
                  }}
                  transition={{
                    duration: 6,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  whileHover={{
                    y: -10,
                    scale: 1.04,
                    rotate: -1,
                  }}
                >
                  <div className="hero-doctors-avatars">
                    {['1', '2', '3', '4'].map((id) => (
                      <img
                        key={id}
                        src={`/assets/images/excerpt-doctor-img-${id}.jpg`}
                        alt={`Doctor ${id}`}
                      />
                    ))}
                  </div>
                  <p>
                    Guided by <strong>48+</strong> health experts
                  </p>
                </motion.div>

                <motion.div
                  className="hero-clients-card gsap-hero-clients"
                  whileHover={{ y: -6, scale: 1.02 }}
                >
                  <span className="hero-clients-icon" aria-hidden="true">
                    <img src="/assets/images/hero-satisfied-clients.svg" alt="Clients" />
                  </span>
                  <div>
                    <h3>{displayCount}+</h3>
                    <p>active members</p>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-block reveal-on-scroll">
        <div className="container-shell">
          <AboutShowcaseSection />
        </div>
      </section>

      <section ref={servicesRef} className="section-block bg-section reveal-on-scroll">
        <div className="container-shell">
          <SectionTitle kicker="Our Services" title="AI tools for everyday personalized health" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <article
                key={service.title}
                className="gsap-service-card overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
              >
                <div className="image-anime">
                  <img
                    src={service.image}
                    alt={service.title}
                    className="h-48 w-full object-cover"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-ink">{service.title}</h3>
                  <p className="mt-3 text-slate-600">{service.text}</p>
                  <Link
                    to="/service-single"
                    className="mt-5 inline-flex text-sm font-semibold uppercase tracking-wide text-brand-600"
                  >
                    Read More
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section-block reveal-on-scroll">
        <div className="container-shell">
          <SectionTitle
            kicker="Health Team"
            title="Experts behind your wellness journey"
            text="Our care and product team works together to deliver practical and personalized health guidance."
          />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {doctors.map((doctor, index) => (
              <motion.article
                key={doctor.name}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.42, delay: index * 0.08 }}
                className="group relative pb-16"
              >
                <div className="image-anime overflow-hidden rounded-[1.75rem]">
                  <img
                    src={doctor.image}
                    alt={doctor.name}
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
                    {doctor.name}
                  </h3>
                  <p className="mt-1 text-base font-normal text-slate-600 transition-colors duration-300 group-hover:text-white/90">
                    {doctor.specialty}
                  </p>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section className="section-block bg-section reveal-on-scroll">
        <div className="container-shell grid gap-10 lg:grid-cols-2">
          <div>
            <SectionTitle
              kicker="Why Choose Us"
              title="Why users trust Healance daily"
              text="We combine medical logic with AI personalization so every recommendation is useful, simple, and actionable."
            />
            <ul className="space-y-3 text-slate-700">
              <li>Daily goals adapt to your real progress and routine.</li>
              <li>AI insights help you make faster, smarter health decisions.</li>
              <li>Risk prediction supports early preventive action.</li>
              <li>One dashboard for water, sleep, activity, and symptoms.</li>
            </ul>
          </div>
          <div className="relative">
            <div className="image-anime overflow-hidden rounded-2xl">
              <img src="/assets/images/intro-video-bg.jpg" alt="Intro" className="w-full" />
            </div>
            <a
              href="https://www.youtube.com/watch?v=Y-x0efG1seA"
              target="_blank"
              rel="noreferrer"
              className="absolute left-1/2 top-1/2 inline-flex -translate-x-1/2 -translate-y-1/2 rounded-full bg-white p-4 shadow-soft"
            >
              <img src="/assets/images/icon-play.svg" alt="Play" className="h-8 w-8" />
            </a>
          </div>
        </div>
      </section>

      <section className="section-block reveal-on-scroll">
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
            <h2 className="home-work-title">A simple daily flow for measurable health progress</h2>
            <p className="home-work-text">
              Healance turns your daily inputs into personalized action steps so healthy routines
              become easier to maintain.
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
                    <p>Follow guided actions and keep building your streak.</p>
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section-block bg-section reveal-on-scroll">
        <div className="container-shell">
          <SectionTitle kicker="Our Numbers" title="Personalized health impact in numbers" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {['85%', '72%', '95%', '76%'].map((value) => (
              <div key={value} className="rounded-2xl bg-white p-6 text-center shadow-soft">
                <h3 className="text-4xl font-bold text-brand-600">{value}</h3>
                <p className="mt-2 text-slate-600">
                  of members improve one key health metric within the first month
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

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
                  Explore common questions about recommendations, data privacy, tracking, and how
                  your personalized plan evolves daily.
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
                        We help you stay consistent with your health goals
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
                              Start with your basic profile details and daily habits. Healance will
                              generate a personalized plan and continuously refine it as you log
                              progress.
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

      <section className="section-block bg-section reveal-on-scroll">
        <div className="container-shell">
          <SectionTitle kicker="Latest News" title="Health updates you need to know" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <article
                key={post.title}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
              >
                <div className="image-anime">
                  <img src={post.image} alt={post.title} className="h-52 w-full object-cover" />
                </div>
                <div className="p-6">
                  <p className="text-sm uppercase tracking-wide text-slate-500">{post.date}</p>
                  <h3 className="mt-3 text-lg font-semibold text-ink">{post.title}</h3>
                  <Link
                    to="/blog-single"
                    className="mt-4 inline-flex text-sm font-semibold uppercase tracking-wide text-brand-600"
                  >
                    Read More
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section-block reveal-on-scroll">
        <div className="container-shell">
          <SectionTitle
            kicker="Our Health"
            title="Your health progress, made visible"
            text="Track meaningful improvements through clear metrics, goals, and personalized guidance."
          />
          <div className="grid gap-6 lg:grid-cols-3">
            <article className="rounded-2xl bg-slate-50 p-6">
              <img src="/assets/images/icon-health-item-1.svg" alt="Health" className="h-10" />
              <h3 className="mt-4 text-2xl font-semibold text-ink">
                Personalized progress for your real lifestyle
              </h3>
              <img src="/assets/images/health-item-img-1.png" alt="Health" className="mt-4" />
            </article>
            <div className="image-anime overflow-hidden rounded-2xl">
              <img
                src="/assets/images/health-item-img-2.jpg"
                alt="Health"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="image-anime overflow-hidden rounded-2xl">
              <img
                src="/assets/images/health-item-img-3.jpg"
                alt="Health"
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <TestimonialsSection
        items={testimonials}
        sectionClassName="section-block pt-6 md:pt-12 reveal-on-scroll"
      />
    </>
  );
}
