import PageHeader from '../components/PageHeader';

const faqs = [
  'What should I bring to my first appointment?',
  'How do I schedule an appointment?',
  'What insurance plans do you accept?',
  'Can I get a prescription refill without an appointment?',
  'What should I expect during my first visit?',
  'How are treatment plans customized for individual needs?',
];

export default function FaqsPage() {
  return (
    <>
      <PageHeader title="FAQs" subtitle="Helping you understand healthcare with clarity." />
      <section className="section-block">
        <div className="container-shell max-w-4xl space-y-4">
          {faqs.map((item, index) => (
            <details
              key={item}
              className="rounded-xl border border-slate-200 bg-white p-5"
              open={index === 0}
            >
              <summary className="cursor-pointer text-lg font-semibold text-ink">{item}</summary>
              <p className="mt-3 text-slate-600">
                For your first visit, bring a valid ID, insurance details, medications list and any
                relevant medical records.
              </p>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}
