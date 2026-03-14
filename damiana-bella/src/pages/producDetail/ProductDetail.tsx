import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { sampleProducts } from '../../data/products';
import type { Product } from '../../types/product';
import Modal from '../../components/common/Modal/Modal';
import VariantTable from '../../components/common/VariantTable/VariantTable';
import './ProductDetail.css';

const COLOR_MAP: Record<string, string> = {
  Beige: '#F5F5DC',
  Gris: '#808080',
  Negro: '#000000',
  Azul: '#1E90FF',
  Vino: '#722F37',
  Camel: '#C19A6B',
  'Gris Oscuro': '#555555',
  'Azul Marino': '#000080',
  Blanco: '#FFFFFF',
  Rojo: '#FF0000',
  Verde: '#008000',
  Amarillo: '#FFFF00',
  Rosa: '#FFC0CB',
  Morado: '#800080',
  Marrón: '#8B4513'
};

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariants, setSelectedVariants] = useState<{ [key: string]: string }>({});
  const [activeTab, setActiveTab] = useState<'description' | 'specs' | 'faq' | 'reviews'>('description');
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [postalCode, setPostalCode] = useState('');
  const [shippingCost, setShippingCost] = useState<number | null>(null);
  const [shippingDays, setShippingDays] = useState<string>('');
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);

  useEffect(() => {
    const foundProduct = sampleProducts.find(p => p.id === Number(id));
    if (foundProduct) {
      setProduct(foundProduct);
    } else {
      navigate('/products');
    }
  }, [id, navigate]);

  if (!product) {
    return <div className="loading">Cargando...</div>;
  }

  const images = product.images || [product.image];
  const currentImage = images[currentImageIndex];
  const discountedPrice = product.discount 
    ? product.price * (1 - product.discount / 100)
    : product.price;

  const handlePreviousImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleQuantityChange = (delta: number) => {
    const newQuantity = quantity + delta;
    if (newQuantity >= 1 && newQuantity <= (product.stock || 99)) {
      setQuantity(newQuantity);
    }
  };

  const handleVariantChange = (variantName: string, option: string) => {
    setSelectedVariants(prev => ({ ...prev, [variantName]: option }));
  };

  const calculateShipping = () => {
    if (postalCode.length < 4) {
      alert('Por favor ingresa un código postal válido');
      return;
    }
    
    // Simulación de cálculo de envío
    if (product.freeShipping) {
      setShippingCost(0);
      setShippingDays('3-5 días hábiles');
    } else {
      // Simulación: costo aleatorio entre 500 y 1500
      const cost = Math.floor(Math.random() * 1000) + 500;
      setShippingCost(cost);
      setShippingDays('5-7 días hábiles');
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="stars">
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star} className={star <= rating ? 'star filled' : 'star'}>
            ★
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="product-detail">
      <div className="product-detail__container">
        {/* Layout principal */}
        <div className="product-detail__main">
          {/* Columna izquierda - Carrusel */}
          <div className="product-detail__gallery">
            <div className="gallery__main">
              <button className="gallery__arrow gallery__arrow--left" onClick={handlePreviousImage}>
                ‹
              </button>
              <img 
                src={currentImage} 
                alt={product.name}
                className="gallery__image"
                onClick={() => setIsImageModalOpen(true)}
              />
              <button className="gallery__arrow gallery__arrow--right" onClick={handleNextImage}>
                ›
              </button>
              
              {product.discount && (
                <div className="gallery__discount-badge">
                  -{product.discount}%
                </div>
              )}
            </div>

            {/* Thumbnails */}
            <div className="gallery__thumbnails">
              {images.map((img, index) => (
                <img
                  key={index}
                  src={img}
                  alt={`${product.name} ${index + 1}`}
                  className={`thumbnail ${index === currentImageIndex ? 'thumbnail--active' : ''}`}
                  onClick={() => setCurrentImageIndex(index)}
                />
              ))}
            </div>

            {/* Indicadores de posición */}
            <div className="gallery__indicators">
              {images.map((_, index) => (
                <span
                  key={index}
                  className={`indicator ${index === currentImageIndex ? 'indicator--active' : ''}`}
                  onClick={() => setCurrentImageIndex(index)}
                />
              ))}
            </div>
          </div>

          {/* Columna derecha - Información */}
          <div className="product-detail__info">
            <div className="info__header">
              <span className="info__condition">
                {product.condition === 'new' ? 'Nuevo' : 'Usado'} | 
                {product.stock && product.stock > 0 ? ` ${product.stock} disponibles` : ' Sin stock'}
              </span>
              <h1 className="info__title">{product.name}</h1>
              
              {/* Rating */}
              {product.rating && (
                <div className="info__rating">
                  {renderStars(product.rating)}
                  <span className="rating__score">{product.rating}</span>
                  <span className="rating__count">({product.reviewCount || 0} opiniones)</span>
                </div>
              )}
            </div>

            {/* Precio */}
            <div className="info__pricing">
              {product.discount && (
                <div className="pricing__original">
                  <span className="original-price">${product.price.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                  <span className="discount-badge">{product.discount}% OFF</span>
                </div>
              )}
              <div className="pricing__final">
                ${discountedPrice.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </div>
              {product.freeShipping && (
                <div className="pricing__shipping">
                  <span className="shipping-badge">Envío gratis</span>
                </div>
              )}
            </div>

            {/* Variantes */}
            {product.variants && product.variants.length > 0 && (
              <div className="info__variants">
                {product.variants.map((variant) => (
                  <div key={variant.name} className="variant">
                    <label className="variant__label">{variant.name}:</label>
                    <div className="variant__options">
                      {variant.options.map((option) => {
                        const isColor = variant.name === 'Color';
                        return isColor ? (
                          <button
                            key={option}
                            className={`variant__color-circle ${selectedVariants[variant.name] === option ? 'variant__color-circle--selected' : ''}`}
                            style={{ backgroundColor: COLOR_MAP[option] || '#CCCCCC' }}
                            title={option}
                            onClick={() => handleVariantChange(variant.name, option)}
                          />
                        ) : (
                          <button
                            key={option}
                            className={`variant__option ${selectedVariants[variant.name] === option ? 'variant__option--selected' : ''}`}
                            onClick={() => handleVariantChange(variant.name, option)}
                          >
                            {option}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
                <button 
                  className="size-guide-btn"
                  onClick={() => setIsSizeGuideOpen(true)}
                >
                  📏 Ver guía de talles
                </button>
              </div>
            )}

            {/* Cantidad */}
            <div className="info__quantity">
              <label className="quantity__label">Cantidad:</label>
              <div className="quantity__controls">
                <button 
                  className="quantity__btn"
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1}
                >
                  -
                </button>
                <input 
                  type="text" 
                  className="quantity__input" 
                  value={quantity}
                  readOnly
                />
                <button 
                  className="quantity__btn"
                  onClick={() => handleQuantityChange(1)}
                  disabled={quantity >= (product.stock || 99)}
                >
                  +
                </button>
              </div>
              <span className="quantity__available">
                ({product.stock || 0} disponibles)
              </span>
            </div>

            {/* Calcular envío */}
            <div className="info__shipping-calculator">
              <label className="shipping-calculator__label">Calcular costo de envío:</label>
              <div className="shipping-calculator__input-group">
                <input 
                  type="text" 
                  className="shipping-calculator__input"
                  placeholder="Ingresa tu código postal"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  maxLength={8}
                />
                <button 
                  className="shipping-calculator__btn"
                  onClick={calculateShipping}
                >
                  Calcular
                </button>
              </div>
              {shippingCost !== null && (
                <div className="shipping-calculator__result">
                  {shippingCost === 0 ? (
                    <p className="shipping-free">✓ Envío gratis - Llega en {shippingDays}</p>
                  ) : (
                    <>
                      <p className="shipping-cost">Costo de envío: ${shippingCost.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</p>
                      <p className="shipping-time">Llega en {shippingDays}</p>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Botones de acción */}
            <div className="info__actions">
              <button 
                className="action-btn action-btn--primary"
                onClick={() => navigate('/checkout')}
              >
                Comprar ahora
              </button>
              <button className="action-btn action-btn--secondary">
                Agregar al carrito
              </button>
            </div>

            {/* Información adicional */}
            <div className="info__additional">
              <div className="additional__item">
                <span className="item__icon">🔒</span>
                <div className="item__content">
                  <strong>Compra Protegida</strong>
                  <p>Recibe el producto que esperabas o te devolvemos tu dinero</p>
                </div>
              </div>

              {product.warranty && (
                <div className="additional__item">
                  <span className="item__icon">✓</span>
                  <div className="item__content">
                    <strong>Garantía</strong>
                    <p>{product.warranty}</p>
                  </div>
                </div>
              )}

              {product.returnPolicy && (
                <div className="additional__item">
                  <span className="item__icon">↩️</span>
                  <div className="item__content">
                    <strong>Devolución gratis</strong>
                    <p>{product.returnPolicy}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sección de descripción detallada */}
        <div className="product-detail__description">
          <div className="description__tabs">
            <button 
              className={`tab ${activeTab === 'description' ? 'tab--active' : ''}`}
              onClick={() => setActiveTab('description')}
            >
              Descripción
            </button>
            {product.specifications && product.specifications.length > 0 && (
              <button 
                className={`tab ${activeTab === 'specs' ? 'tab--active' : ''}`}
                onClick={() => setActiveTab('specs')}
              >
                Especificaciones
              </button>
            )}
            {product.faqs && product.faqs.length > 0 && (
              <button 
                className={`tab ${activeTab === 'faq' ? 'tab--active' : ''}`}
                onClick={() => setActiveTab('faq')}
              >
                Preguntas frecuentes
              </button>
            )}
            {product.reviews && product.reviews.length > 0 && (
              <button 
                className={`tab ${activeTab === 'reviews' ? 'tab--active' : ''}`}
                onClick={() => setActiveTab('reviews')}
              >
                Opiniones ({product.reviews.length})
              </button>
            )}
          </div>

          <div className="description__content">
            {activeTab === 'description' && (
              <div className="content__description">
                <h2>Descripción</h2>
                <p>{product.description}</p>
                
                {product.features && product.features.length > 0 && (
                  <>
                    <h3>Características principales</h3>
                    <ul className="features-list">
                      {product.features.map((feature, index) => (
                        <li key={index}>
                          <span className="feature-icon">✓</span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            )}

            {activeTab === 'specs' && product.specifications && (
              <div className="content__specs">
                <h2>Especificaciones técnicas</h2>
                <table className="specs-table">
                  <tbody>
                    {product.specifications.map((spec, index) => (
                      <tr key={index}>
                        <td className="spec-label">{spec.label}</td>
                        <td className="spec-value">{spec.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'faq' && product.faqs && (
              <div className="content__faq">
                <h2>Preguntas frecuentes</h2>
                {product.faqs.map((faq, index) => (
                  <div key={index} className="faq-item">
                    <h4 className="faq-question">{faq.question}</h4>
                    <p className="faq-answer">{faq.answer}</p>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'reviews' && product.reviews && (
              <div className="content__reviews">
                <h2>Opiniones del producto</h2>
                {product.reviews.map((review) => (
                  <div key={review.id} className="review">
                    <div className="review__header">
                      <strong>{review.author}</strong>
                      {renderStars(review.rating)}
                      <span className="review__date">{review.date}</span>
                    </div>
                    <p className="review__comment">{review.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de imagen ampliada */}
      {isImageModalOpen && (
        <div className="image-modal" onClick={() => setIsImageModalOpen(false)}>
          <div className="image-modal__content">
            <button className="image-modal__close" onClick={() => setIsImageModalOpen(false)}>
              ✕
            </button>
            <img src={currentImage} alt={product.name} />
          </div>
        </div>
      )}

      {/* Modal de Variantes / Guía de talles */}
      <Modal
        isOpen={isSizeGuideOpen}
        onClose={() => setIsSizeGuideOpen(false)}
        title="Panel de Stock / Guía de Talles"
      >
        <VariantTable />
      </Modal>
    </div>
  );
};

export default ProductDetail;
