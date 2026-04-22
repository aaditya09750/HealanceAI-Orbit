import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

function getVisibleCount() {
  if (typeof window === 'undefined') {
    return 3;
  }

  if (window.innerWidth < 768) {
    return 1;
  }

  if (window.innerWidth < 1024) {
    return 2;
  }

  return 3;
}

export default function TestimonialsSection({
  items,
  sectionClassName = 'section-block pt-6 md:pt-12',
}) {
  const [startIndex, setStartIndex] = useState(0);
  const [visibleCount, setVisibleCount] = useState(getVisibleCount);
  const [direction, setDirection] = useState(1);

  useEffect(() => {
    const handleResize = () => {
      setVisibleCount(getVisibleCount());
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    if (!items?.length) {
      return undefined;
    }

    setStartIndex((current) => current % items.length);

    return undefined;
  }, [items, visibleCount]);

  useEffect(() => {
    if (!items?.length || items.length <= 1) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setDirection(1);
      setStartIndex((current) => (current + 1) % items.length);
    }, 2200);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [items]);

  const visibleItems = useMemo(() => {
    if (!items?.length) {
      return [];
    }

    const count = Math.min(visibleCount, items.length);
    const result = [];

    for (let i = 0; i < count; i += 1) {
      result.push(items[(startIndex + i) % items.length]);
    }

    return result;
  }, [items, startIndex, visibleCount]);

  const showPrev = () => {
    if (!items?.length) {
      return;
    }

    setDirection(-1);
    setStartIndex((current) => (current - 1 + items.length) % items.length);
  };

  const showNext = () => {
    if (!items?.length) {
      return;
    }

    setDirection(1);
    setStartIndex((current) => (current + 1) % items.length);
  };

  return (
    <section className={sectionClassName}>
      <div className="container-shell">
        <div className="mx-auto max-w-3xl text-center">
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-[#5666d4]">
            <img src="/assets/images/icon-sub-heading.svg" alt="" className="h-4 w-4" />
            <span>Member Stories</span>
          </p>
          <h2 className="mt-3 text-3xl font-semibold leading-tight text-[#0b1030] md:text-[3rem] md:leading-[1.08]">
            Real progress from personalized daily plans
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-[#5f697a] md:text-lg">
            See how members improved hydration, activity, sleep, and consistency with AI-guided
            routines.
          </p>
        </div>

        <div className="services-testimonial-wrap">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={`${startIndex}-${visibleCount}`}
              initial={{ opacity: 0, x: direction > 0 ? 18 : -18 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction > 0 ? -18 : 18 }}
              transition={{ duration: 0.32, ease: 'easeOut' }}
              className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
            >
              {visibleItems.map((item) => (
                <motion.article
                  key={`${item.name}-${item.role}`}
                  whileHover={{ y: -5 }}
                  className="services-testimonial-card"
                >
                  <p className="services-stars">★★★★★</p>
                  <p className="services-testimonial-text">
                    The daily planner kept me accountable. In just a few weeks, my sleep and
                    hydration habits became consistent without feeling overwhelming.
                  </p>
                  <div className="services-testimonial-user">
                    <img src={item.image} alt={item.name} />
                    <div>
                      <h3>{item.name}</h3>
                      <p>{item.role}</p>
                    </div>
                  </div>
                </motion.article>
              ))}
            </motion.div>
          </AnimatePresence>

          <div className="mt-8 flex items-center justify-center gap-3">
            <button
              type="button"
              className="services-testimonial-nav"
              aria-label="Previous testimonial"
              onClick={showPrev}
            >
              <i className="fa-solid fa-arrow-left" />
            </button>
            <button
              type="button"
              className="services-testimonial-nav"
              aria-label="Next testimonial"
              onClick={showNext}
            >
              <i className="fa-solid fa-arrow-right" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
