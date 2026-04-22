import PageHeader from '../components/PageHeader';
import SectionTitle from '../components/SectionTitle';
import SimpleCardGrid from '../components/SimpleCardGrid';
import { doctorItems } from '../data/siteData';

export default function DoctorsPage() {
  return (
    <>
      <PageHeader title="Doctors" subtitle="Compassionate experts you can trust." />
      <section className="section-block">
        <div className="container-shell">
          <SectionTitle kicker="Team Members" title="Specialists across key medical disciplines" />
          <SimpleCardGrid items={doctorItems} link="/doctor-single" />
        </div>
      </section>
    </>
  );
}
