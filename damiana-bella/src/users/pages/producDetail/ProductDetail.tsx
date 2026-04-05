import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchProductById, mapDbRowToProduct } from '../../../services/productService';
import type { Product } from '../../../types/product';
import Modal from '../../../components/common/Modal/Modal';
import VariantTable from '../../../components/common/VariantTable/VariantTable';
import PurchaseVariantModal from '../../components/PurchaseVariantModal/PurchaseVariantModal';
import { parseColorOption } from '../../../utils/constants';
import { getProductPricing } from '../../../utils/pricing';
import { INVALID_PRODUCT_PRICE_MESSAGE } from '../../../services/orderService';
import { useCartStore } from '../../../store/cartStore';
import type { UnitVariants } from '../../../store/cartStore';
import { useBodyScrollLock } from '../../../hooks/useBodyScrollLock';
import { useInitialLoadTask } from '../../../components/common/InitialLoad/InitialLoadProvider';
import './ProductDetail.css';

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariants, setSelectedVariants] = useState<{ [key: string]: string }>({});
  const [activeTab, setActiveTab] = useState<'description' | 'specs' | 'faq'>('description');
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [postalCode, setPostalCode] = useState('');
  const [shippingCost, setShippingCost] = useState<number | null>(null);
  const [shippingDays, setShippingDays] = useState<string>('');
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);
  const [variantError, setVariantError] = useState('');
  const [missingVariants, setMissingVariants] = useState<string[]>([]);
  const [isShaking, setIsShaking] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [isMainImageReady, setIsMainImageReady] = useState(false);
  const cartItems = useCartStore((s) => s.items);
  const addItem = useCartStore((s) => s.addItem);
  const setItem = useCartStore((s) => s.setItem);

  useBodyScrollLock(isImageModalOpen);

  const images = product?.images || (product?.image ? [product.image] : []);
  const currentImage = images[currentImageIndex] || '';

  useInitialLoadTask('route', !product || (!!currentImage && !isMainImageReady));

  useEffect(() => {
    fetchProductById(id!)
      .then((row) => setProduct(mapDbRowToProduct(row)))
      .catch(() => navigate('/products'));
  }, [id, navigate]);

  useEffect(() => {
    if (!product) {
      return;
    }

    setIsMainImageReady(currentImage === '');
  }, [currentImage, product]);

  if (!product) {
    return <div className="loading">Cargando...</div>;
  }

  const pricing = getProductPricing(product);
  const discountedPrice = pricing.finalPrice;
  const hasValidPrice = Number.isFinite(discountedPrice) && discountedPrice > 0;

  const handlePreviousImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const stock = product.stock ?? 0;
  const currentCartQuantity = cartItems.find((item) => item.product.id === product.id)?.quantity ?? 0;
  const remainingCartCapacity = Math.max(0, stock - currentCartQuantity);
  const canAddSelectedQuantityToCart = remainingCartCapacity > 0 && quantity <= remainingCartCapacity;

  const handleQuantityChange = (delta: number) => {
    const newQuantity = quantity + delta;
    if (newQuantity >= 1 && newQuantity <= stock) {
      setVariantError('');
      setQuantity(newQuantity);
    }
  };

  const handleVariantChange = (variantName: string, option: string) => {
    setSelectedVariants(prev => ({ ...prev, [variantName]: option }));
  };

  const calculateShipping = async () => {
    if (postalCode.length < 4) {
      alert('Por favor ingresa un código postal válido');
      return;
    }

    try {
      // Si tiene envío gratis, no llama al backend
      if (product.freeShipping) {
        setShippingCost(0);
        setShippingDays('3-5 días hábiles');
        return;
      }

      // Llamar al endpoint real de shipping
      const response = await fetch(
        `${import.meta.env.VITE_API_URL_LOCAL}/shipping?postalCode=${encodeURIComponent(postalCode)}`
      );

      if (!response.ok) {
        throw new Error('Error al calcular envío');
      }

      const data = await response.json();
      setShippingCost(data.cost ?? 0);
      setShippingDays(data.days ?? '5-7 días hábiles');
    } catch (error) {
      console.error('Error calculating shipping:', error);
      alert('Error al calcular el costo de envío. Por favor intenta nuevamente.');
    }
  };

  const hasVariants = (product?.variants?.length ?? 0) > 0;

  const getMissingVariants = (): string[] => {
    if (!product?.variants) return [];
    return product.variants
      .filter(v => !selectedVariants[v.name])
      .map(v => v.name);
  };

  const confirmPurchase = (unitVariants: UnitVariants[]) => {
    if (!hasValidPrice) {
      setVariantError(INVALID_PRODUCT_PRICE_MESSAGE);
      return;
    }

    setIsVariantModalOpen(false);
    setItem({
      product: product!,
      quantity,
      unitVariants,
      unitPrice: discountedPrice,
      totalPrice: discountedPrice * quantity,
      source: 'direct',
    });
    navigate('/checkout');
  };

  const handleAddToCart = () => {
    setVariantError('');
    setMissingVariants([]);

    if (remainingCartCapacity <= 0) {
      setVariantError('Ya agregaste al carrito todas las unidades disponibles de este producto.');
      return;
    }

    if (quantity > remainingCartCapacity) {
      setVariantError(`Solo podés agregar ${remainingCartCapacity} ${remainingCartCapacity === 1 ? 'unidad' : 'unidades'} más de este producto.`);
      return;
    }

    if (!hasValidPrice) {
      setVariantError(INVALID_PRODUCT_PRICE_MESSAGE);
      return;
    }

    const missing = getMissingVariants();
    if (missing.length > 0) {
      setVariantError(`Por favor seleccioná: ${missing.join(', ')}`);
      setMissingVariants(missing);
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      document.querySelector('.info__variants')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    const cartUnitVariants: UnitVariants[] = Array.from({ length: quantity }, () => ({ ...selectedVariants }));
    addItem(product!, quantity, cartUnitVariants);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const handleBuy = () => {
    setVariantError('');
    setMissingVariants([]);
    if (!hasValidPrice) {
      setVariantError(INVALID_PRODUCT_PRICE_MESSAGE);
      return;
    }

    const missing = getMissingVariants();
    if (missing.length > 0) {
      setVariantError(`Por favor seleccioná: ${missing.join(', ')}`);
      setMissingVariants(missing);
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      document.querySelector('.info__variants')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    if (quantity > 1 && hasVariants) {
      setIsVariantModalOpen(true);
      return;
    }
    // qty === 1 or no variants — go directly
    const sameVariants: UnitVariants[] = Array.from({ length: quantity }, () => ({ ...selectedVariants }));
    confirmPurchase(sameVariants);
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
                onLoad={() => setIsMainImageReady(true)}
                onError={() => setIsMainImageReady(true)}
              />
              <button className="gallery__arrow gallery__arrow--right" onClick={handleNextImage}>
                ›
              </button>
              
              {pricing.hasPromotion && pricing.discountPercentage && (
                <div className="gallery__discount-badge">
                  -{pricing.discountPercentage}%
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
            </div>

            {/* Precio */}
            <div className="info__pricing">
              {pricing.hasPromotion && pricing.originalPrice && pricing.discountPercentage && (
                <div className="pricing__original">
                  <span className="original-price">${pricing.originalPrice.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                  <span className="discount-badge">{pricing.discountPercentage}% OFF</span>
                </div>
              )}
              <div className="pricing__final">
                ${discountedPrice.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </div>
              {!hasValidPrice && (
                <p className="pricing__warning">
                  Este producto no esta disponible para compra porque todavia no tiene un precio asignado.
                </p>
              )}
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
                  <div key={variant.name} className={`variant${missingVariants.includes(variant.name) ? ` variant--error${isShaking ? ' variant--shake' : ''}` : ''}`}>
                    <label className="variant__label">{variant.name}:</label>
                    <div className="variant__options">
                      {variant.options.map((option) => {
                        const isColor = variant.name.toLowerCase() === 'color';
                        const isTalle = variant.name.toLowerCase().startsWith('talle');

                        // Verificar si este talle tiene stock
                        const isTalleOutOfStock = isTalle && variant.stockByOption && variant.stockByOption[option] === 0;

                        const { name: colorName, hex: colorHex } = isColor
                          ? parseColorOption(option)
                          : { name: option, hex: '' };

                        return isColor ? (
                          <button
                            key={option}
                            className={`variant__color-circle ${selectedVariants[variant.name] === option ? 'variant__color-circle--selected' : ''}`}
                            style={{ backgroundColor: colorHex }}
                            title={colorName}
                            onClick={() => handleVariantChange(variant.name, option)}
                            disabled={isTalleOutOfStock}
                          />
                        ) : (
                          <div
                            key={option}
                            className={`variant__option-wrap ${isTalleOutOfStock ? 'variant__option-wrap--soldout' : ''}`}
                          >
                            <button
                              className={`variant__option ${selectedVariants[variant.name] === option ? 'variant__option--selected' : ''} ${isTalleOutOfStock ? 'variant__option--soldout' : ''}`}
                              onClick={() => {
                                if (!isTalleOutOfStock) {
                                  handleVariantChange(variant.name, option);
                                }
                              }}
                              disabled={isTalleOutOfStock}
                            >
                              <span className="variant__option-text">
                                {isTalle ? option.toUpperCase() : option}
                              </span>
                            </button>
                            {isTalleOutOfStock && (
                              <span className="variant__option-strike" aria-hidden="true" />
                            )}
                          </div>
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
                  disabled={quantity <= 1 || stock === 0}
                >
                  -
                </button>
                <input
                  type="text"
                  className="quantity__input"
                  value={stock === 0 ? 0 : quantity}
                  readOnly
                />
                <button
                  className="quantity__btn"
                  onClick={() => handleQuantityChange(1)}
                  disabled={stock === 0 || quantity >= stock}
                >
                  +
                </button>
              </div>
              <span className={`quantity__available${stock === 0 ? ' quantity__available--out' : ''}`}>
                {stock === 0
                  ? 'Sin stock'
                  : currentCartQuantity > 0
                    ? remainingCartCapacity > 0
                      ? `(${stock} disponibles, ${remainingCartCapacity} para agregar)`
                      : '(Ya agregaste el stock disponible al carrito)'
                    : `(${stock} disponibles)`}
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
            {variantError && (
              <div className="variant-error-banner">
                <span className="variant-error-banner__icon">!</span>
                <span>{variantError}</span>
              </div>
            )}
            <div className="info__actions">
              <button
                className="action-btn action-btn--primary"
                onClick={handleBuy}
                disabled={stock === 0 || !hasValidPrice}
              >
                Comprar ahora
              </button>
              <button
                className={`action-btn action-btn--secondary${addedToCart ? ' action-btn--secondary-added' : ''}`}
                onClick={handleAddToCart}
                disabled={stock === 0 || !hasValidPrice || !canAddSelectedQuantityToCart}
              >
                {remainingCartCapacity <= 0
                  ? 'Stock máximo en carrito'
                  : addedToCart
                    ? '¡Agregado al carrito!'
                    : 'Agregar al carrito'}
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

      {/* Modal de selección de variantes por unidad */}
      {isVariantModalOpen && product && (
        <PurchaseVariantModal
          isOpen={isVariantModalOpen}
          onClose={() => setIsVariantModalOpen(false)}
          onConfirm={confirmPurchase}
          product={product}
          quantity={quantity}
          initialVariants={selectedVariants}
        />
      )}
    </div>
  );
};

export default ProductDetail;
