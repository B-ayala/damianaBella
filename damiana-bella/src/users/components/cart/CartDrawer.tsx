import React from 'react';
import { FiX, FiTrash2, FiShoppingCart } from 'react-icons/fi';
import { useCartStore } from '../../../store/cartStore';
import './CartDrawer.css';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose }) => {
  const items = useCartStore((s) => s.items);
  const removeItem = useCartStore((s) => s.removeItem);
  const clearCart = useCartStore((s) => s.clearCart);

  const total = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);

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
              {items.map((item) => (
                <li key={item.product.id} className="cart-drawer__item">
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="cart-drawer__item-img"
                  />
                  <div className="cart-drawer__item-info">
                    <span className="cart-drawer__item-name">{item.product.name}</span>
                    <span className="cart-drawer__item-qty">x{item.quantity}</span>
                    <span className="cart-drawer__item-price">
                      ${(item.product.price * item.quantity).toFixed(2)}
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
              ))}
            </ul>

            <div className="cart-drawer__footer">
              <div className="cart-drawer__total">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
              <button className="cart-drawer__clear" onClick={clearCart}>
                Vaciar carrito
              </button>
              <button className="cart-drawer__checkout">
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
