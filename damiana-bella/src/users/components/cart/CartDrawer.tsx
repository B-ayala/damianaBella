import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiX, FiTrash2, FiShoppingCart } from 'react-icons/fi';
import { useCartStore } from '../../../store/cartStore';
import { useBodyScrollLock } from '../../../hooks/useBodyScrollLock';
import { getProductPricing } from '../../../utils/pricing';
import './CartDrawer.css';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose }) => {
  useBodyScrollLock(isOpen);
  const navigate = useNavigate();
  const items = useCartStore((s) => s.items);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const clearCart = useCartStore((s) => s.clearCart);

  const total = items.reduce((sum, i) => sum + getProductPricing(i.product).finalPrice * i.quantity, 0);

  return (
    <>
      <div className={`cart-overlay ${isOpen ? 'active' : ''}`} onClick={onClose} />
      <div className={`cart-drawer ${isOpen ? 'active' : ''}`}>
        <div className="cart-drawer__header">
          <h2 className="cart-drawer__title">
            <FiShoppingCart /> Carrito
          </h2>
          <button className="cart-drawer__close" onClick={onClose}>
            <FiX />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="cart-drawer__empty">
            <FiShoppingCart className="cart-drawer__empty-icon" />
            <p>Tu carrito esta vacio</p>
          </div>
        ) : (
          <>
            <ul className="cart-drawer__list">
              {items.map((item) => {
                const pricing = getProductPricing(item.product);

                return (
                  <li key={item.product.id} className="cart-drawer__item">
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="cart-drawer__item-img"
                    />
                    <div className="cart-drawer__item-info">
                      <span className="cart-drawer__item-name">{item.product.name}</span>
                      <div className="cart-drawer__qty-controls">
                        <button
                          className="cart-drawer__qty-btn"
                          onClick={() => updateQuantity(item.product.id, -1)}
                        >
                          −
                        </button>
                        <span className="cart-drawer__item-qty">{item.quantity}</span>
                        <button
                          className="cart-drawer__qty-btn"
                          onClick={() => updateQuantity(item.product.id, 1)}
                        >
                          +
                        </button>
                      </div>
                      <span className="cart-drawer__item-price">
                        ${(pricing.finalPrice * item.quantity).toFixed(2)}
                      </span>
                    </div>
                    <button
                      className="cart-drawer__remove"
                      onClick={() => removeItem(item.product.id)}
                      title="Eliminar"
                    >
                      <FiTrash2 />
                    </button>
                  </li>
                );
              })}
            </ul>

            <div className="cart-drawer__footer">
              <div className="cart-drawer__total">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
              <button className="cart-drawer__clear" onClick={clearCart}>
                Vaciar carrito
              </button>
              <button
                className="cart-drawer__checkout"
                onClick={() => { onClose(); navigate('/checkout'); }}
              >
                Ir a pagar
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default CartDrawer;
