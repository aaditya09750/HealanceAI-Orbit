import PageHeader from '../components/PageHeader';
import SimpleCardGrid from '../components/SimpleCardGrid';

const facilityItems = [
  {
    title: 'Emergency Wing Upgrade',
    text: 'Faster triage and intensive care access.',
    image: '/assets/images/case-study-img-7.jpg',
  },
  {
    title: 'Advanced Imaging Lab',
    text: 'New diagnostic precision for faster decisions.',
    image: '/assets/images/case-study-img-8.jpg',
  },
  {
    title: 'Patient Comfort Initiative',
    text: 'Improved recovery spaces and guided support.',
    image: '/assets/images/case-study-img-9.jpg',
  },
];

export default function ProjectsPage() {
  return (
    <>
      <PageHeader title="Facilities" subtitle="Infrastructure projects that improve outcomes." />
      <section className="section-block">
        <div className="container-shell">
          <SimpleCardGrid items={facilityItems} link="/case-study-single" />
        </div>
      </section>
    </>
  );
}
