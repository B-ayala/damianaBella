import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { fetchCarouselImages } from '../../../services/productService';
import './Carousel.css';

interface Slide {
  images: string[];
}

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

const Carousel = () => {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);

  // Detect mobile/desktop based on window width
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch carousel images and group them based on device type
  useEffect(() => {
    const deviceType = isMobile ? 'mobile' : 'desktop';
    const imgsPerSlide = isMobile ? 2 : 3;

    fetchCarouselImages(deviceType)
      .then(images => {
        const grouped: Slide[] = [];
        for (let i = 0; i < images.length; i += imgsPerSlide) {
          grouped.push({ images: images.slice(i, i + imgsPerSlide).map(img => img.url) });
        }
        setSlides(grouped);
        setCurrentSlide(0);
      })
      .catch(console.error);
  }, [isMobile]);

  const nextSlide = () => {
    setDirection(1);
    setCurrentSlide(prev => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setDirection(-1);
    setCurrentSlide(prev => (prev - 1 + slides.length) % slides.length);
  };

  const goToSlide = (index: number) => {
    setDirection(index > currentSlide ? 1 : -1);
    setCurrentSlide(index);
  };

  useEffect(() => {
    if (slides.length === 0) return;
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, [currentSlide, slides.length]);

  if (slides.length === 0) return null;

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
            x: { type: 'spring', stiffness: 300, damping: 30 },
            opacity: { duration: 0.5 }
          }}
          className="carousel-slide"
        >
          <div className="carousel-images-container">
            {slides[currentSlide].images.map((img, idx) => (
              <div
                key={idx}
                className="carousel-image"
                style={{ backgroundImage: `url(${img})` }}
              />
            ))}
            <div className="carousel-overlay" />
          </div>
        </motion.div>
      </AnimatePresence>

      <button className="carousel-arrow carousel-arrow-left" onClick={prevSlide}>
        <FiChevronLeft />
      </button>
      <button className="carousel-arrow carousel-arrow-right" onClick={nextSlide}>
        <FiChevronRight />
      </button>

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
