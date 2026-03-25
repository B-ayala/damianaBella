import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiShoppingCart } from 'react-icons/fi';
import type { Product } from '../../../types/product';
import { parseColorOption } from '../../../utils/constants';
import { useCartStore } from '../../../store/cartStore';
import './ProductCard.css';

interface ProductCardProps {
  product: Product;
  onReadMore?: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onReadMore }) => {
  const navigate = useNavigate();
  const addItem = useCartStore((s) => s.addItem);

  const handleReadMore = () => {
    if (onReadMore) {
      onReadMore(product);
    } else {
      navigate(`/product/${product.id}`);
    }
  };

  const colorVariant = product.variants?.find(v => v.name.toLowerCase() === 'color');

  return (
    <div className="product-card">
      <div className="product-card__image-container" onClick={handleReadMore}>
        <img 
          src={product.image} 
          alt={product.name}
          className="product-card__image"
        />
      </div>
      
      <div className="product-card__content">
        <h3 className="product-card__name">{product.name}</h3>
        <p className="product-card__price">${product.price.toFixed(2)}</p>
        
        {colorVariant && colorVariant.options && (
          <div className="product-card__colors">
            {colorVariant.options.map((color, index) => {
              const { name, hex } = parseColorOption(color);
              return (
                <span
                  key={index}
                  className="product-card__color-circle"
                  style={{ backgroundColor: hex }}
                  title={name}
                />
              );
            })}
          </div>
        )}

        <div className="product-card__actions">
          <button
            className="product-card__button"
            onClick={handleReadMore}
          >
            Leer más
          </button>
          <button
            className="product-card__cart-btn"
            onClick={() => addItem(product)}
            title="Agregar al carrito"
          >
            <FiShoppingCart />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
