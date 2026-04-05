import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiX, FiTrash2, FiShoppingCart } from 'react-icons/fi';
import { useCartStore } from '../../../store/cartStore';
import type { UnitVariants } from '../../../store/cartStore';
import { useAdminStore } from '../../../admin/store/adminStore';
import { useBodyScrollLock } from '../../../hooks/useBodyScrollLock';
import { getProductPricing } from '../../../utils/pricing';
import { buildCloudinaryUrl } from '../../../utils/cloudinary';
import AuthModal from '../auth/AuthModal';
import PurchaseVariantModal from '../PurchaseVariantModal/PurchaseVariantModal';
import './CartDrawer.css';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose }) => {
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  useBodyScrollLock(isOpen);

  useEffect(() => {
    document.body.classList.toggle('cart-drawer-open', isOpen);

    return () => {
      document.body.classList.remove('cart-drawer-open');
    };
  }, [isOpen]);

  const navigate = useNavigate();
  const currentUser = useAdminStore((s) => s.currentUser);
  const items = useCartStore((s) => s.items);
  const setItem = useCartStore((s) => s.setItem);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const clearCart = useCartStore((s) => s.clearCart);

  const total = items.reduce((sum, i) => sum + getProductPricing(i.product).finalPrice * i.quantity, 0);

  const continueToCheckout = (unitVariants: UnitVariants[]) => {
    const cartItem = items[0];
    if (!cartItem) {
      return;
    }

    const pricing = getProductPricing(cartItem.product);
    setItem({
      product: cartItem.product,
      quantity: cartItem.quantity,
      unitVariants,
      unitPrice: pricing.finalPrice,
      totalPrice: pricing.finalPrice * cartItem.quantity,
      source: 'cart',
    });

    setIsVariantModalOpen(false);
    onClose();

    if (currentUser) {
      navigate('/checkout');
      return;
    }

    setIsAuthModalOpen(true);
  };

  const handleCheckout = () => {
    const cartItem = items[0];
    if (!cartItem) {
      return;
    }

    const hasVariants = (cartItem.product.variants?.length ?? 0) > 0;

    if (cartItem.quantity > 1 && hasVariants) {
      setIsVariantModalOpen(true);
      return;
    }

    continueToCheckout(cartItem.unitVariants);
  };

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
                const stockLimit = item.product.stock ?? Number.POSITIVE_INFINITY;
                const reachedStockLimit = Number.isFinite(stockLimit) && item.quantity >= stockLimit;

                return (
                  <li key={item.product.id} className="cart-drawer__item">
                    <img
                      src={buildCloudinaryUrl(item.product.image, {
                        width: 80,
                        quality: 'auto',
                        format: 'auto'
                      })}
                      alt={item.product.name}
                      className="cart-drawer__item-img"
                      loading="lazy"
                      decoding="async"
                      width={80}
                      height={80}
                    />
                    <div className="cart-drawer__item-info">
                      <span className="cart-drawer__item-name">{item.product.name}</span>
                      <div className="cart-drawer__qty-controls">
                        <button
                          className="cart-drawer__qty-btn"
                          onClick={() => updateQuantity(item.product.id, -1)}
                          disabled={item.quantity <= 1}
                        >
                          −
                        </button>
                        <span className="cart-drawer__item-qty">{item.quantity}</span>
                        <button
                          className="cart-drawer__qty-btn"
                          onClick={() => updateQuantity(item.product.id, 1)}
                          disabled={reachedStockLimit}
                        >
                          +
                        </button>
                      </div>
                      {reachedStockLimit && (
                        <span className="cart-drawer__item-stock-limit">Stock máximo alcanzado</span>
                      )}
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
                onClick={handleCheckout}
              >
                Ir a pagar
              </button>
            </div>
          </>
        )}
      </div>

      {items[0] && (
        <PurchaseVariantModal
          isOpen={isVariantModalOpen}
          onClose={() => setIsVariantModalOpen(false)}
          onConfirm={continueToCheckout}
          product={items[0].product}
          quantity={items[0].quantity}
          initialVariants={items[0].unitVariants[0] ?? {}}
        />
      )}

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => {
          setIsAuthModalOpen(false);
          navigate('/checkout');
        }}
      />
    </>
  );
};

export default CartDrawer;
