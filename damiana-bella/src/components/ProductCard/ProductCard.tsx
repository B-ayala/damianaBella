import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { Product } from '../../types/product';
import './ProductCard.css';

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

interface ProductCardProps {
  product: Product;
  onReadMore?: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onReadMore }) => {
  const navigate = useNavigate();

  const handleReadMore = () => {
    if (onReadMore) {
      onReadMore(product);
    } else {
      navigate(`/product/${product.id}`);
    }
  };

  const colorVariant = product.variants?.find(v => v.name === 'Color');

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
            {colorVariant.options.map((color, index) => (
              <span 
                key={index}
                className="product-card__color-circle"
                style={{ backgroundColor: COLOR_MAP[color] || '#CCCCCC' }}
                title={color}
              />
            ))}
          </div>
        )}

        <button 
          className="product-card__button"
          onClick={handleReadMore}
        >
          Leer más
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
