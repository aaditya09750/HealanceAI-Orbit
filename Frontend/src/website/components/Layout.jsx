import Navbar from './Navbar';
import Footer from './Footer';
import ScrollReveal from './ScrollReveal';
import Topbar from './Topbar';
import Preloader from './Preloader';
import { Outlet } from 'react-router-dom';

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-white">
      <Preloader />
      <ScrollReveal />
      <Topbar />
      <Navbar />
      <main>{children ?? <Outlet />}</main>
      <Footer />
    </div>
  );
}
