import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function ScrollReveal() {
  const { pathname } = useLocation();

  useEffect(() => {
    const triggers = [];
    const ctx = gsap.context(() => {
      const elements = gsap.utils.toArray('.reveal-on-scroll');

      elements.forEach((el) => {
        gsap.set(el, { autoAlpha: 0, y: 24 });

        const trigger = ScrollTrigger.create({
          trigger: el,
          start: 'top 84%',
          once: true,
          onEnter: () => {
            gsap.to(el, {
              autoAlpha: 1,
              y: 0,
              duration: 0.7,
              ease: 'power2.out',
            });
          },
        });

        triggers.push(trigger);
      });
    });

    return () => {
      triggers.forEach((trigger) => trigger.kill());
      ctx.revert();
    };
  }, [pathname]);

  return null;
}
