import PageHeader from '../components/PageHeader';
import SectionTitle from '../components/SectionTitle';
import CtaBanner from '../components/CtaBanner';

export default function ServiceSinglePage() {
  return (
    <>
      <PageHeader
        title="Service Details"
        subtitle="Advanced medical solutions for every patient's needs."
      />
      <section className="section-block">
        <div className="container-shell grid gap-10 lg:grid-cols-3">
          <article className="lg:col-span-2">
            <img
              src="/assets/images/service-entry-img-1.jpg"
              alt="Service"
              className="w-full rounded-2xl object-cover"
            />
            <SectionTitle
              kicker="Neurology"
              title="Expert care for complex neurological conditions"
              text="Our specialists diagnose and treat disorders of the brain, spine and nerves using modern protocols."
            />
            <p className="text-slate-600">
              We focus on early diagnosis, multidisciplinary treatment and supportive rehabilitation
              to improve long-term outcomes.
            </p>
          </article>
          <aside className="space-y-4 rounded-2xl border border-slate-200 p-6">
            <h3 className="text-xl font-semibold text-ink">Key Benefits</h3>
            <ul className="space-y-2 text-slate-600">
              <li>Personalized treatment plans</li>
              <li>High-precision diagnostics</li>
              <li>Integrated specialist collaboration</li>
              <li>Post-treatment follow-up support</li>
            </ul>
            <img
              src="/assets/images/service-entry-img-2.jpg"
              alt="Service"
              className="mt-4 rounded-xl"
            />
          </aside>
        </div>
      </section>
      <CtaBanner />
    </>
  );
}
