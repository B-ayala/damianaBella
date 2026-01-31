import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import modelo1 from '../../assets/modelos/modelo1.png';
import modelo2 from '../../assets/modelos/modelo2.png';
import './Carousel.css';

const slides = [
  {
    id: 1,
    image: modelo1,
    title: 'ACCESORIOS EXCLUSIVOS',
    subtitle: 'Completa tu look perfecto',
    buttonText: 'COMPRAR AHORA'
  },
  {
    id: 2,
    image: modelo2,
    title: 'ACCESORIOS EXCLUSIVOS',
    subtitle: 'Completa tu look perfecto',
    buttonText: 'COMPRAR AHORA'
  }
];

const Carousel = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(0);

  const nextSlide = () => {
    setDirection(1);
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setDirection(-1);
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToSlide = (index: number) => {
    setDirection(index > currentSlide ? 1 : -1);
    setCurrentSlide(index);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      nextSlide();
    }, 5000);

    return () => clearInterval(timer);
  }, [currentSlide]);

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 1000 : -1000,
      opacity: 0
    })
  };

  return (
    <div className="carousel">
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={currentSlide}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.5 }
          }}
          className="carousel-slide"
        >
          <div 
            className="carousel-image"
            style={{ backgroundImage: `url(${slides[currentSlide].image})` }}
          >
            <div className="carousel-overlay"></div>
          </div>

          <motion.div 
            className="carousel-content"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <motion.h1 
              className="carousel-title"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              {slides[currentSlide].title}
            </motion.h1>
            <motion.p 
              className="carousel-subtitle"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7, duration: 0.6 }}
            >
              {slides[currentSlide].subtitle}
            </motion.p>
            <motion.button 
              className="carousel-button"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.9, duration: 0.5 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {slides[currentSlide].buttonText}
            </motion.button>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Arrows */}
      <button className="carousel-arrow carousel-arrow-left" onClick={prevSlide}>
        <FiChevronLeft />
      </button>
      <button className="carousel-arrow carousel-arrow-right" onClick={nextSlide}>
        <FiChevronRight />
      </button>

      {/* Dots Navigation */}
      <div className="carousel-dots">
        {slides.map((_, index) => (
          <button
            key={index}
            className={`carousel-dot ${index === currentSlide ? 'active' : ''}`}
            onClick={() => goToSlide(index)}
          />
        ))}
      </div>
    </div>
  );
};

export default Carousel;
