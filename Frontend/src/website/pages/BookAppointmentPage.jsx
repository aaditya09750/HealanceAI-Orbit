import { useState } from 'react';
import PageHeader from '../components/PageHeader';

const initialForm = {
  name: '',
  email: '',
  phone: '',
  doctor: '',
  date: '',
  message: '',
};

export default function BookAppointmentPage() {
  const [form, setForm] = useState(initialForm);
  const [submitted, setSubmitted] = useState(false);

  const onChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const onSubmit = (event) => {
    event.preventDefault();
    setSubmitted(true);
    setForm(initialForm);
  };

  return (
    <>
      <PageHeader
        title="Book Appointment"
        subtitle="Schedule your consultation in a few simple steps."
      />
      <section className="section-block">
        <div className="container-shell max-w-3xl">
          <form
            onSubmit={onSubmit}
            className="space-y-4 rounded-2xl border border-slate-200 p-6 shadow-soft"
          >
            <input
              name="name"
              value={form.name}
              onChange={onChange}
              required
              placeholder="Full Name"
              className="w-full rounded-lg border border-slate-300 px-4 py-3"
            />
            <input
              name="email"
              value={form.email}
              onChange={onChange}
              required
              type="email"
              placeholder="Email"
              className="w-full rounded-lg border border-slate-300 px-4 py-3"
            />
            <input
              name="phone"
              value={form.phone}
              onChange={onChange}
              required
              placeholder="Phone"
              className="w-full rounded-lg border border-slate-300 px-4 py-3"
            />
            <input
              name="doctor"
              value={form.doctor}
              onChange={onChange}
              placeholder="Preferred Doctor"
              className="w-full rounded-lg border border-slate-300 px-4 py-3"
            />
            <input
              name="date"
              value={form.date}
              onChange={onChange}
              type="date"
              className="w-full rounded-lg border border-slate-300 px-4 py-3"
            />
            <textarea
              name="message"
              value={form.message}
              onChange={onChange}
              rows="5"
              placeholder="Message"
              className="w-full rounded-lg border border-slate-300 px-4 py-3"
            />
            {submitted ? (
              <p className="text-emerald-600">Appointment request submitted successfully.</p>
            ) : null}
            <button type="submit" className="btn-primary">
              Submit Request
            </button>
          </form>
        </div>
      </section>
    </>
  );
}
