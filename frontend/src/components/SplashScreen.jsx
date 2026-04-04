import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import videoSrc from '../assets/projext.mp4';

const SplashScreen = () => {
  const navigate = useNavigate();
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Start fade-out at 4s, navigate at 5s (after 1s fade)
    const fadeTimer = setTimeout(() => setFadeOut(true), 4000);
    const navTimer  = setTimeout(() => navigate('/home'), 5000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(navTimer);
    };
  }, [navigate]);

  return (
    <div className={`splash-container${fadeOut ? ' fade-out' : ''}`}>
      <video
        className="splash-video"
        autoPlay
        muted
        playsInline
      >
        <source src={videoSrc} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </div>
  );
};

export default SplashScreen;
