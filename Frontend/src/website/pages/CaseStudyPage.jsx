import PageHeader from '../components/PageHeader';
import SectionTitle from '../components/SectionTitle';
import SimpleCardGrid from '../components/SimpleCardGrid';
import { caseStudyItems } from '../data/siteData';

export default function CaseStudyPage() {
  return (
    <>
      <PageHeader title="Case Study" subtitle="Real treatment journeys and measurable outcomes." />
      <section className="section-block">
        <div className="container-shell">
          <SectionTitle
            kicker="Success Stories"
            title="Clinical cases from diagnosis to recovery"
          />
          <SimpleCardGrid items={caseStudyItems} link="/case-study-single" />
        </div>
      </section>
    </>
  );
}
