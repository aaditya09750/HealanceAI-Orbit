import PageHeader from '../components/PageHeader';

export default function CaseStudySinglePage() {
  return (
    <>
      <PageHeader title="Case Study Details" subtitle="Cardiac Recovery Program" />
      <section className="section-block">
        <div className="container-shell max-w-4xl">
          <img
            src="/assets/images/case-study-img-1.jpg"
            alt="Case Study"
            className="w-full rounded-2xl"
          />
          <h2 className="mt-8 text-3xl font-bold text-ink">
            From high-risk diagnosis to stable recovery
          </h2>
          <p className="mt-4 text-slate-600">
            This pathway combined medication optimization, nutrition planning and structured
            physiotherapy to improve cardiac function.
          </p>
          <p className="mt-4 text-slate-600">
            Within 16 weeks, patient stamina improved significantly with lower symptom recurrence
            and higher confidence in daily activity.
          </p>
        </div>
      </section>
    </>
  );
}
