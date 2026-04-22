import { useState } from 'react';
import SectionTitle from '../components/SectionTitle';
import PageHeader from '../components/PageHeader';
import { motion } from 'framer-motion';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const initialState = {
  name: '',
  email: '',
  phone: '',
  subject: '',
  message: '',
};

export default function ContactPage() {
  const [form, setForm] = useState(initialState);
  const [status, setStatus] = useState({ loading: false, error: '', success: '' });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus({ loading: true, error: '', success: '' });

    try {
      const [firstName = '', ...lastNameParts] = form.name.trim().split(/\s+/);
      const payload = {
        firstName,
        lastName: lastNameParts.join(' '),
        email: form.email,
        message: form.message,
        subject: form.subject?.trim() || 'General Inquiry',
        phone: form.phone,
      };

      const response = await fetch(`${API_URL}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      setForm(initialState);
      setStatus({ loading: false, error: '', success: 'Message sent successfully.' });
    } catch (error) {
      setStatus({ loading: false, error: error.message, success: '' });
    }
  };

  return (
    <>
      <PageHeader
        title="Contact Us"
        subtitle="Reach out to our care team for appointments and support."
      />
      <section className="section-block">
        <div className="container-shell">
          <div className="contact-showcase-panel">
            <div className="grid gap-8 lg:grid-cols-12">
              <motion.div
                className="space-y-4 lg:col-span-4"
                initial={{ opacity: 0, x: -18 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45 }}
              >
                <article className="contact-info-tile">
                  <span className="contact-info-icon">
                    <i className="fa-solid fa-phone" />
                  </span>
                  <div>
                    <h3>Contact Details</h3>
                    <p>+01-787-582-568</p>
                  </div>
                </article>

                <article className="contact-info-tile">
                  <span className="contact-info-icon">
                    <i className="fa-solid fa-location-dot" />
                  </span>
                  <div>
                    <h3>Address</h3>
                    <p>403, Port Washington Road, Canada</p>
                  </div>
                </article>

                <article className="contact-info-tile">
                  <span className="contact-info-icon">
                    <i className="fa-solid fa-envelope" />
                  </span>
                  <div>
                    <h3>Email Us</h3>
                    <p>info@domain.com</p>
                  </div>
                </article>

                <div className="contact-follow-row">
                  <strong>Follow Us:</strong>
                  <a href="#" aria-label="Facebook">
                    <i className="fa-brands fa-facebook-f" />
                  </a>
                  <a href="#" aria-label="Twitter">
                    <i className="fa-brands fa-twitter" />
                  </a>
                  <a href="#" aria-label="LinkedIn">
                    <i className="fa-brands fa-linkedin-in" />
                  </a>
                  <a href="#" aria-label="Pinterest">
                    <i className="fa-brands fa-pinterest-p" />
                  </a>
                </div>
              </motion.div>

              <motion.div
                className="lg:col-span-8"
                initial={{ opacity: 0, x: 18 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.05 }}
              >
                <SectionTitle
                  kicker="Contact Us"
                  title="Reach out for questions"
                  text="We take the time to understand your individual needs and goals, creating customized treatment plans to help you achieve optimal oral health."
                />

                <form onSubmit={handleSubmit} className="space-y-4">
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Enter Your Name"
                    className="contact-input"
                    required
                  />

                  <div className="grid gap-4 md:grid-cols-2">
                    <input
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      type="email"
                      placeholder="Enter Your Email"
                      className="contact-input"
                      required
                    />
                    <input
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="Enter Your Number"
                      className="contact-input"
                      required
                    />
                  </div>

                  <textarea
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    rows="5"
                    placeholder="Write Message.."
                    className="contact-input resize-none"
                    required
                  />

                  <input
                    type="hidden"
                    name="subject"
                    value={form.subject}
                    onChange={handleChange}
                  />

                  {status.error ? (
                    <p className="text-sm font-medium text-red-600">{status.error}</p>
                  ) : null}
                  {status.success ? (
                    <p className="text-sm font-medium text-emerald-600">{status.success}</p>
                  ) : null}

                  <button type="submit" className="btn-primary" disabled={status.loading}>
                    {status.loading ? 'Sending...' : 'Submit Now'}
                  </button>
                </form>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-block bg-section">
        <div className="container-shell">
          <SectionTitle
            kicker="Location"
            title="Get in touch with us"
            text="Visit our center or contact us online for immediate assistance."
          />
          <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-soft">
            <iframe
              title="Healance Location"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d96737.10562045308!2d-74.08535042841811!3d40.739265258395164!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c24fa5d33f083b%3A0xc80b8f06e177fe62!2sNew%20York%2C%20NY%2C%20USA!5e0!3m2!1sen!2sin!4v1703158537552!5m2!1sen!2sin"
              className="h-[280px] w-full sm:h-[360px] md:h-[420px]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </section>
    </>
  );
}
