import { useEffect, useRef, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useAuth } from '../../context/AuthContext';

gsap.registerPlugin(ScrollTrigger);

const links = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About' },
  { to: '/services', label: 'Features' },
  { to: '/blog', label: 'Insights' },
];

const pageLinks = [
  { to: '/service-single', label: 'Feature Details' },
  { to: '/blog-single', label: 'Article Details' },
  { to: '/doctors', label: 'Expert Team' },
  { to: '/doctor', label: 'Expert Profile' },
  { to: '/doctor-single', label: 'Expert Details' },
  { to: '/case-study', label: 'Success Stories' },
  { to: '/case-study-single', label: 'Story Details' },
  { to: '/image-gallery', label: 'Image Gallery' },
  { to: '/video-gallery', label: 'Video Gallery' },
  { to: '/projects', label: 'Platform Highlights' },
  { to: '/book-appointment', label: 'Get Started' },
  { to: '/index-image', label: 'Index Image' },
  { to: '/faqs', label: 'FAQs' },
  { to: '/404', label: '404 Page' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [mobilePagesOpen, setMobilePagesOpen] = useState(false);
  const [desktopPagesOpen, setDesktopPagesOpen] = useState(false);
  const headerRef = useRef(null);
  const pagesMenuRef = useRef(null);
  const openRef = useRef(open);
  const { user, openAuthModal } = useAuth();

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (pagesMenuRef.current && !pagesMenuRef.current.contains(event.target)) {
        setDesktopPagesOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  useEffect(() => {
    const header = headerRef.current;
    if (!header) {
      return undefined;
    }

    const showNavbar = () => {
      gsap.to(header, { yPercent: 0, duration: 0.28, ease: 'power2.out', overwrite: 'auto' });
    };

    const hideNavbar = () => {
      gsap.to(header, { yPercent: -100, duration: 0.3, ease: 'power2.out', overwrite: 'auto' });
    };

    gsap.set(header, { yPercent: 0 });
    showNavbar();

    const trigger = ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: (self) => {
        if (openRef.current) {
          showNavbar();
          return;
        }

        if (self.scroll() < 80) {
          showNavbar();
          return;
        }

        if (self.direction === 1) {
          hideNavbar();
        } else {
          showNavbar();
        }
      },
    });

    return () => {
      trigger.kill();
      gsap.killTweensOf(header);
      gsap.set(header, { yPercent: 0 });
    };
  }, []);

  useEffect(() => {
    if (open && headerRef.current) {
      gsap.to(headerRef.current, {
        yPercent: 0,
        duration: 0.2,
        ease: 'power2.out',
        overwrite: 'auto',
      });
    }
  }, [open]);

  return (
    <header ref={headerRef} className="sticky top-0 z-50 border-b border-[#55617124] bg-white">
      <div className="container-shell relative flex h-24 items-center justify-between gap-4">
        <Link
          to="/"
          className="flex items-center gap-2 transition-transform duration-300 hover:scale-[1.03]"
        >
          <img src="/assets/images/logo.png" alt="Healance" className="h-10" />
        </Link>

        <button
          type="button"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm lg:hidden"
          onClick={() => setOpen((prev) => !prev)}
          aria-label="Toggle navigation"
        >
          Menu
        </button>

        <nav
          className={`${open ? 'flex' : 'hidden'} absolute left-0 top-24 w-full flex-col border-b border-[#55617124] bg-white p-4 lg:absolute lg:left-1/2 lg:top-1/2 lg:flex lg:w-auto lg:-translate-x-1/2 lg:-translate-y-1/2 lg:flex-row lg:items-center lg:gap-8 lg:border-0 lg:bg-transparent lg:p-0`}
        >
          {links.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `whitespace-nowrap py-2 text-base font-semibold transition ${isActive ? 'text-brand-600' : 'text-[#0b1030] hover:text-brand-600'}`
              }
              onClick={() => {
                setOpen(false);
                setMobilePagesOpen(false);
              }}
            >
              {item.label}
            </NavLink>
          ))}

          <div ref={pagesMenuRef} className="relative py-2 text-base font-semibold text-[#0b1030]">
            <button
              type="button"
              className="inline-flex w-full items-center justify-between gap-2 lg:w-auto"
              onClick={() => {
                if (window.innerWidth >= 1024) {
                  setDesktopPagesOpen((prev) => !prev);
                } else {
                  setMobilePagesOpen((prev) => !prev);
                }
              }}
            >
              <span>Pages</span>
              <i
                className={`fa-solid fa-angle-down text-xs transition-transform duration-200 ${mobilePagesOpen || desktopPagesOpen ? 'rotate-180' : ''}`}
              />
            </button>

            <div
              className={`${mobilePagesOpen ? 'block' : 'hidden'} mt-2 rounded-xl border border-slate-200 bg-slate-50 p-2 lg:hidden`}
            >
              {pageLinks.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className="block rounded-lg px-3 py-2 text-[15px] text-slate-700 hover:bg-slate-100"
                  onClick={() => {
                    setOpen(false);
                    setMobilePagesOpen(false);
                    setDesktopPagesOpen(false);
                  }}
                >
                  {item.label}
                </NavLink>
              ))}
            </div>

            <div
              className={`${desktopPagesOpen ? 'hidden lg:block' : 'hidden'} min-w-72 rounded-xl border border-slate-200 bg-white p-3 shadow-soft lg:absolute lg:left-1/2 lg:top-full lg:-translate-x-1/2`}
            >
              {pageLinks.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className="block rounded-lg px-3 py-2 text-[16px] text-slate-700 hover:bg-slate-100"
                  onClick={() => {
                    setOpen(false);
                    setMobilePagesOpen(false);
                    setDesktopPagesOpen(false);
                  }}
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
          <NavLink
            to="/contact"
            className={({ isActive }) =>
              `whitespace-nowrap py-2 text-base font-semibold transition ${isActive ? 'text-brand-600' : 'text-[#0b1030] hover:text-brand-600'}`
            }
            onClick={() => {
              setOpen(false);
              setMobilePagesOpen(false);
            }}
          >
            Contact
          </NavLink>
          {user ? (
            <Link
              to="/dashboard"
              className="btn-primary mt-3 lg:hidden"
              onClick={() => setOpen(false)}
            >
              Dashboard
            </Link>
          ) : (
            <button
              type="button"
              className="btn-primary mt-3 lg:hidden"
              onClick={() => {
                setOpen(false);
                setMobilePagesOpen(false);
                openAuthModal();
              }}
            >
              Login
            </button>
          )}
        </nav>

        <div className="hidden lg:flex lg:justify-end">
          {user ? (
            <Link to="/dashboard" className="btn-primary">
              Dashboard
            </Link>
          ) : (
            <button type="button" className="btn-primary" onClick={openAuthModal}>
              Login
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
