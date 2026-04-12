import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiX, FiTrash2, FiShoppingCart } from 'react-icons/fi';
import { useCartStore } from '../../../store/cartStore';
import type { UnitVariants } from '../../../store/cartStore';
import { useAdminStore } from '../../../admin/store/adminStore';
import { useBodyScrollLock } from '../../../hooks/useBodyScrollLock';
import { getProductPricing } from '../../../utils/pricing';
import { buildCloudinaryUrl } from '../../../utils/cloudinary';
import { parseColorOption } from '../../../utils/constants';
import { areUnitVariantSelectionsValid, canAddAnotherUnitWithSelection } from '../../../utils/productVariants';
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
  const [selectedProductIdForVariantModal, setSelectedProductIdForVariantModal] = useState<string | number | null>(null);
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
  const removeItem = useCartStore((s) => s.removeItem);
  const setUnitVariants = useCartStore((s) => s.setUnitVariants);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const clearCart = useCartStore((s) => s.clearCart);
  const setItem = useCartStore((s) => s.setItem);
  const selectedCartItem = items.find((item) => item.product.id === selectedProductIdForVariantModal) ?? null;

  const total = items.reduce((sum, i) => sum + getProductPricing(i.product).finalPrice * i.quantity, 0);

  const continueToCheckout = (unitVariants?: UnitVariants[]) => {
    const cartItem = selectedCartItem ?? items[0];
    if (cartItem && unitVariants) {
      setUnitVariants(cartItem.product.id, unitVariants);
    }

    // Limpiar cualquier item directo persistido para que checkout muestre todos los del carrito
    setItem(null);

    setIsVariantModalOpen(false);
  setSelectedProductIdForVariantModal(null);
    onClose();

    if (currentUser) {
      navigate('/checkout');
      return;
    }

    setIsAuthModalOpen(true);
  };

  const handleCheckout = () => {
    if (items.length === 0) {
      return;
    }

    const invalidCartItem = items.find((cartItem) => {
      const hasVariants = (cartItem.product.variants?.length ?? 0) > 0;
      return hasVariants && !areUnitVariantSelectionsValid(cartItem.product, cartItem.unitVariants);
    });

    if (invalidCartItem) {
      setSelectedProductIdForVariantModal(invalidCartItem.product.id);
      setIsVariantModalOpen(true);
      return;
    }

    setSelectedProductIdForVariantModal(null);
    continueToCheckout();
  };

  const buildVariantLine = (variants: UnitVariants): string[] =>
    Object.entries(variants).map(([name, value]) => {
      const isColor = name.toLowerCase() === 'color';
      const displayValue = isColor ? parseColorOption(value).name : value.toUpperCase();
      return `${name}: ${displayValue}`;
    });

  return (
    <>
      <div className={`cart-overlay ${isOpen ? 'active' : ''}`} onClick={onClose} />
      <div className={`cart-drawer ${isOpen ? 'active' : ''}`}>
        <div className="cart-drawer__header">
          <h2 className="cart-drawer__title">
            <FiShoppingCart aria-hidden="true" /> Carrito
          </h2>
          <button className="cart-drawer__close" onClick={onClose} aria-label="Cerrar carrito">
            <FiX aria-hidden="true" />
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
                const reachedStockLimit = !canAddAnotherUnitWithSelection(item.product, item.unitVariants);
                const allSameVariants =
                  item.unitVariants.length <= 1 ||
                  item.unitVariants.every(
                    (selection) => JSON.stringify(selection) === JSON.stringify(item.unitVariants[0])
                  );
                const sharedVariantLine = item.unitVariants[0] ? buildVariantLine(item.unitVariants[0]) : [];

                return (
                  <li key={item.product.id} className="cart-drawer__item">
                    <img
                      src={buildCloudinaryUrl(item.product.image, {
                        width: 72,
                        height: 96,
                        crop: 'fit',
                        quality: 'auto',
                        format: 'auto'
                      })}
                      alt={item.product.name}
                      className="cart-drawer__item-img"
                      loading="lazy"
                      decoding="async"
                      width={72}
                      height={96}
                    />
                    <div className="cart-drawer__item-body">
                      <div className="cart-drawer__item-info">
                        <span className="cart-drawer__item-name">{item.product.name}</span>
                        {sharedVariantLine.length > 0 && allSameVariants && (
                          <div className="cart-drawer__variants">
                            <span className="cart-drawer__variants-label">Variantes:</span>
                            <span className="cart-drawer__variants-value">{sharedVariantLine.join(' · ')}</span>
                          </div>
                        )}
                        {!allSameVariants && (
                          <div className="cart-drawer__variants cart-drawer__variants--stacked">
                            {item.unitVariants.map((unitSelection, index) => {
                              const unitVariantLine = buildVariantLine(unitSelection);

                              if (unitVariantLine.length === 0) {
                                return null;
                              }

                              return (
                                <span key={`${String(item.product.id)}-${index}`} className="cart-drawer__variants-value">
                                  Unidad {index + 1}: {unitVariantLine.join(' · ')}
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      <div className="cart-drawer__item-actions">
                        <div className="cart-drawer__item-meta">
                          <div className="cart-drawer__qty-controls">
                            <button
                              className="cart-drawer__qty-btn"
                              onClick={() => updateQuantity(item.product.id, -1)}
                              disabled={item.quantity <= 1}
                              aria-label={`Reducir cantidad de ${item.product.name}`}
                            >
                              <span aria-hidden="true">−</span>
                            </button>
                            <span className="cart-drawer__item-qty" aria-label={`Cantidad: ${item.quantity}`}>{item.quantity}</span>
                            <button
                              className="cart-drawer__qty-btn"
                              onClick={() => updateQuantity(item.product.id, 1)}
                              disabled={reachedStockLimit}
                              aria-label={`Aumentar cantidad de ${item.product.name}`}
                            >
                              <span aria-hidden="true">+</span>
                            </button>
                          </div>
                          <div className="cart-drawer__item-summary">
                            {reachedStockLimit && (
                              <span className="cart-drawer__item-stock-limit">Stock máximo alcanzado</span>
                            )}
                            <span className="cart-drawer__item-price">
                              ${(pricing.finalPrice * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        </div>
                        <button
                          className="cart-drawer__remove"
                          onClick={() => removeItem(item.product.id)}
                          aria-label={`Eliminar ${item.product.name} del carrito`}
                        >
                          <FiTrash2 aria-hidden="true" />
                        </button>
                      </div>
                    </div>
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

      {selectedCartItem && (
        <PurchaseVariantModal
          isOpen={isVariantModalOpen}
          onClose={() => {
            setIsVariantModalOpen(false);
            setSelectedProductIdForVariantModal(null);
          }}
          onConfirm={continueToCheckout}
          product={selectedCartItem.product}
          quantity={selectedCartItem.quantity}
          initialVariants={selectedCartItem.unitVariants[0] ?? {}}
          initialUnitVariants={selectedCartItem.unitVariants}
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
