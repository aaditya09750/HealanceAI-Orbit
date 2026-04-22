import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import TestimonialsSection from '../components/TestimonialsSection';

const services = [
  {
    icon: '/assets/images/icon-service-1.svg',
    title: 'Urology',
    text: 'Regular exams are essential for monitoring your overall health and detecting potential issues early.',
    image: '/assets/images/service-img-1.jpg',
  },
  {
    icon: '/assets/images/icon-service-2.svg',
    title: 'Neurology',
    text: 'Special care focuses on providing tailored attention to address unique health needs, ensuring optimal well-being and comfort.',
    image: '/assets/images/service-img-2.jpg',
  },
  {
    icon: '/assets/images/icon-service-3.svg',
    title: 'Eye Care',
    text: 'Lab testing is vital for accurately monitoring your health and identifying potential issues early for effective treatment.',
    image: '/assets/images/service-img-3.jpg',
  },
  {
    icon: '/assets/images/icon-service-4.svg',
    title: 'Vaccinations',
    text: 'Vaccinations are crucial for safeguarding your health and preventing potential illnesses through timely immunization.',
    image: '/assets/images/service-img-4.jpg',
  },
  {
    icon: '/assets/images/icon-service-5.svg',
    title: 'Chronic Care',
    text: 'Chronic care focuses on managing long-term conditions to improve overall health and enhance quality of life.',
    image: '/assets/images/service-img-5.jpg',
  },
  {
    icon: '/assets/images/icon-service-6.svg',
    title: 'Pharmacy',
    text: 'Our pharmacy ensures access to essential medications, providing convenience and expert guidance for your health needs.',
    image: '/assets/images/service-img-6.jpg',
  },
];

const workSteps = [
  { no: '01', title: 'Create Account', image: '/assets/images/work-step-img-1.jpg' },
  { no: '02', title: 'Search Doctor', image: '/assets/images/work-step-img-2.jpg' },
  { no: '03', title: 'Schedule Appointment', image: '/assets/images/work-step-img-3.jpg' },
  { no: '04', title: 'Start Consultation', image: '/assets/images/happy-client-img-4.jpg' },
];

const testimonials = [
  { name: 'Brooklyn Simmons', role: 'Orthodontics', image: '/assets/images/author-1.jpg' },
  { name: 'Monika Roy', role: 'Dental Hygienist', image: '/assets/images/author-2.jpg' },
  { name: 'Albert Flores', role: 'Senior Dentist', image: '/assets/images/author-3.jpg' },
];

export default function ServicesPage() {
  return (
    <>
      <PageHeader title="Services" />

      <section className="section-block pt-4 md:pt-8">
        <div className="container-shell">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {services.map((item, index) => (
              <motion.article
                key={item.title}
                initial={{ opacity: 0, y: 26 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ duration: 0.45, delay: index * 0.08 }}
                whileHover={{ y: -6 }}
                className="service-page-card"
              >
                <div className="service-page-card-head">
                  <div className="service-page-title-wrap">
                    <span className="service-page-icon" aria-hidden="true">
                      <img src={item.icon} alt="" />
                    </span>
                    <h3>{item.title}</h3>
                  </div>
                  <Link
                    to="/service-single"
                    className="service-page-arrow"
                    aria-label={`Open ${item.title}`}
                  >
                    <img src="/assets/images/arrow-dark.svg" alt="" />
                  </Link>
                </div>

                <p>{item.text}</p>

                <Link
                  to="/service-single"
                  className="service-page-thumb image-anime"
                  aria-label={`${item.title} details`}
                >
                  <img src={item.image} alt={item.title} />
                </Link>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section className="section-block pt-6 md:pt-12">
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
              We are committed to improving health outcomes through personalized care, innovative
              treatments, and a focus on prevention.
            </p>

            <div className="work-steps-box">
              {workSteps.map((step, index) => (
                <motion.article
                  key={step.no}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.35 }}
                  transition={{ duration: 0.42, delay: index * 0.09 }}
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
                    <p>Join our community by creating an account today.</p>
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <TestimonialsSection items={testimonials} sectionClassName="section-block pt-6 md:pt-12" />
    </>
  );
}
