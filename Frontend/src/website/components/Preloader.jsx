import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

export default function Preloader() {
  const { pathname } = useLocation();
  const [visible, setVisible] = useState(true);
  const [isHiding, setIsHiding] = useState(false);

  useEffect(() => {
    let startHideTimer;
    let hideTimer;

    const playLoader = () => {
      setVisible(true);
      setIsHiding(false);

      // Keep loader visible briefly on each route render, then fade out.
      startHideTimer = window.setTimeout(() => {
        setIsHiding(true);
        hideTimer = window.setTimeout(() => {
          setVisible(false);
        }, 600);
      }, 260);
    };

    playLoader();

    return () => {
      window.clearTimeout(startHideTimer);
      window.clearTimeout(hideTimer);
    };
  }, [pathname]);

  if (!visible) {
    return null;
  }

  return (
    <div className={`preloader${isHiding ? ' is-hiding' : ''}`}>
      <div className="loading-container">
        <div className="loading" />
        <div id="loading-icon">
          <img src="/assets/images/loader.svg" alt="Loading" />
        </div>
      </div>
    </div>
  );
}
