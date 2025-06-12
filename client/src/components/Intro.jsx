import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import bg1 from '../assets/images/bg5.jpg';
import bg2 from '../assets/images/bg2.jpg';
import bg3 from '../assets/images/bg3.jpg';
import bg4 from '../assets/images/bg13.jpg';

const TEXTS = ['Monitoring', 'System'];
const BACKGROUNDS = [bg1, bg2, bg3, bg4];

const TYPING_SPEED = 100; 
const DELETING_SPEED = 50;
const DELAY_BETWEEN_WORDS = 1000;
const IMAGE_CYCLE_SEC = 2000;

const textVariants = {
  initial: { y: 50, opacity: 0, scale: 0.95 },
  animate: { y: 0, opacity: 1, scale: 1, transition: { duration: 1, ease: 'easeOut' } },
};
const imageVariants = {
  initial: { x: '100%', opacity: 0 },
  animate: { x: 0, opacity: 1, transition: { duration: 0.5, ease: 'easeOut' } },
  exit: { x: '-100%', opacity: 0, transition: { duration: 0.5, ease: 'easeIn' } },
};

const visuallyHidden = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0,0,0,0)',
  border: 0,
};

const IntroPage = () => {
  const navigate = useNavigate();
  const [displayedText, setDisplayedText] = useState('');
  const [wordIndex, setWordIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentImgIdx, setCurrentImgIdx] = useState(0);
  const [hasInteracted, setHasInteracted] = useState(false);
  const audioRef = useRef(null);

  // User Interaction Detection
  useEffect(() => {
    const handleInteraction = () => {
      setHasInteracted(true);
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
    };
    window.addEventListener('click', handleInteraction);
    window.addEventListener('touchstart', handleInteraction);

    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
    };
  }, []);

  // Typing Effect
  useEffect(() => {
    const currentWord = TEXTS[wordIndex];
    const timer = setTimeout(() => {
      if (!isDeleting && charIndex < currentWord.length) {
        setDisplayedText((prev) => prev + currentWord[charIndex]);
        setCharIndex((prev) => prev + 1);
        if (hasInteracted && audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play().catch(() => {});
        }
      } else if (isDeleting && charIndex > 0) {
        setDisplayedText((prev) => prev.slice(0, -1));
        setCharIndex((prev) => prev - 1);
      } else if (!isDeleting && charIndex === currentWord.length) {
        setTimeout(() => setIsDeleting(true), DELAY_BETWEEN_WORDS);
      } else if (isDeleting && charIndex === 0) {
        setIsDeleting(false);
        setWordIndex((prev) => (prev + 1) % TEXTS.length);
      }
    }, isDeleting ? DELETING_SPEED : TYPING_SPEED);

    return () => clearTimeout(timer);
  }, [charIndex, isDeleting, wordIndex, hasInteracted]);

  // Background Image Cycling
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImgIdx((prev) => (prev + 1) % BACKGROUNDS.length);
    }, IMAGE_CYCLE_SEC);
    return () => clearInterval(timer);
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center relative overflow-hidden" aria-label="Intro Page">
      {/* Animated Background */}
      <AnimatePresence initial={false}>
        <motion.div
          key={currentImgIdx}
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${BACKGROUNDS[currentImgIdx]})` }}
          variants={imageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          aria-hidden="true"
        >
          {/* Visually hidden alt text for background */}
          <span style={visuallyHidden}>Background illustration</span>
        </motion.div>
      </AnimatePresence>

      {/* Overlay */}
      <motion.div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(to bottom,rgba(0,0,0,0.7),rgba(0,0,0,0.6) 60%,rgba(0,0,0,0.8))', zIndex: 10 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { duration: 0.8 } }}
        aria-hidden="true"
      />

      {/* Content */}
      <section className="relative text-center z-20 px-4 w-full max-w-md md:max-w-2xl mx-auto">
        <motion.header
          variants={textVariants}
          initial="initial"
          animate="animate"
          className="mb-4"
        >
          <h1 className="text-4xl md:text-7xl font-bold text-white mb-2 drop-shadow-lg flex items-center justify-center">
            <i className="fas fa-droplet mr-2 text-cyan-500" aria-hidden="true"></i>
            Water Quality
          </h1>
        </motion.header>
        <motion.div
          className="text-4xl md:text-5xl font-semibold text-cyan-400 mb-2 drop-shadow-lg"
          variants={textVariants}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.3 }}
          aria-live="polite"
          aria-atomic="true"
        >
          {displayedText}
          <AnimatePresence>
            <motion.span
              className="inline-block w-1 h-8 md:h-10 bg-white ml-1 align-middle rounded"
              initial={{ opacity: 1 }}
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 0.5, repeat: Infinity }}
              aria-hidden="true"
            ></motion.span>
          </AnimatePresence>
        </motion.div>
        <motion.p
          className="text-lg md:text-xl text-white/80 mt-4 font-medium"
          variants={textVariants}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.6 }}
        >  
          Ensuring clean and safe water for all
        </motion.p>
        <motion.button
          className="mt-8 px-8 py-3 bg-cyan-600 text-white font-semibold rounded-full hover:bg-cyan-700 active:scale-95 shadow-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 transition"
          variants={textVariants}
          initial="initial"
          animate="animate"
          transition={{ delay: 1.5 }}
          onClick={() => {
            setHasInteracted(true);
            navigate('/login');
          }}
          aria-label="Get Started"
        >
          Get Started
        </motion.button>
      </section>
      <audio ref={audioRef} src="/sounds/type.mp3" preload="auto"></audio>
    </main>
  );
};

export default IntroPage;