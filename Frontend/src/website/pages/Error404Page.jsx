import { Link } from 'react-router-dom';

export default function Error404Page() {
  return (
    <section className="section-block">
      <div className="container-shell text-center">
        <img src="/assets/images/404-error-img.png" alt="404" className="mx-auto max-h-72" />
        <h1 className="mt-8 text-4xl font-bold text-ink">Page Not Found</h1>
        <p className="mt-3 text-slate-600">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link to="/" className="btn-primary mt-6">
          Back to Home
        </Link>
      </div>
    </section>
  );
}
