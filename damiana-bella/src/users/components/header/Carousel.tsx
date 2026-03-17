import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import img1 from '../../../assets/products/saquito.png';
import img2 from '../../../assets/products/saquito2.png';
import img3 from '../../../assets/products/pantalon.jpeg';
import './Carousel.css';

const slides = [
  {
    id: 1,
    images: [img3, img1, img2],
    title: 'NUEVA COLECCIÓN',
    subtitle: 'Descubre las últimas tendencias',
    buttonText: 'VER CATÁLOGO'
  },
  {
    id: 2,
    images: [img1, img2, img3],
    title: 'ESTILO ÚNICO',
    subtitle: 'Prendas exclusivas para ti',
    buttonText: 'COMPRAR AHORA'
  },
  {
    id: 3,
    images: [img2, img3, img1],
    title: 'OFERTAS ESPECIALES',
    subtitle: 'Renueva tu guardarropa',
    buttonText: 'VER OFERTAS'
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
          <div className="carousel-images-container">
            {slides[currentSlide].images.map((img, idx) => (
              <div 
                key={idx}
                className="carousel-image"
                style={{ backgroundImage: `url(${img})` }}
              ></div>
            ))}
            <div className="carousel-overlay"></div>
          </div>


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
