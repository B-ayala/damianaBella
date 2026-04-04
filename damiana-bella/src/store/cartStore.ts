import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product } from '../types/product';
import { getProductPricing } from '../utils/pricing';

export type UnitVariants = { [key: string]: string };
export type CheckoutItemSource = 'cart' | 'direct';

export interface CartItem {
  product: Product;
  quantity: number;
  unitVariants: UnitVariants[];
}

export interface CheckoutItem {
  product: Product;
  quantity: number;
  unitVariants: UnitVariants[];
  unitPrice: number;
  totalPrice: number;
  source?: CheckoutItemSource;
}

interface CartState {
  items: CartItem[];
  item: CheckoutItem | null;
  addItem: (product: Product, qty?: number, unitVariants?: UnitVariants[]) => void;
  removeItem: (productId: string | number) => void;
  updateQuantity: (productId: string | number, delta: number) => void;
  clearCart: () => void;
  totalItems: () => number;
  setItem: (item: CheckoutItem | null) => void;
}

const buildUnitVariants = (qty: number, unitVariants?: UnitVariants[]): UnitVariants[] => {
  if (unitVariants && unitVariants.length > 0) {
    return unitVariants.slice(0, qty).map((variants) => ({ ...variants }));
  }

  return Array.from({ length: qty }, () => ({}));
};

const buildCheckoutItemFromCartItem = (cartItem: CartItem): CheckoutItem => {
  const { finalPrice } = getProductPricing(cartItem.product);

  return {
    product: cartItem.product,
    quantity: cartItem.quantity,
    unitVariants: cartItem.unitVariants,
    unitPrice: finalPrice,
    totalPrice: finalPrice * cartItem.quantity,
    source: 'cart',
  };
};

const syncCheckoutItemWithCart = (cartItems: CartItem[], currentItem: CheckoutItem | null) => {
  if (!currentItem || currentItem.source === 'direct') {
    return currentItem;
  }

  if (cartItems.length !== 1) {
    return null;
  }

  return buildCheckoutItemFromCartItem(cartItems[0]);
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      item: null,

      setItem: (item) => set({ item }),

      addItem: (product, qty = 1, unitVariants) =>
        set((state) => {
          const existing = state.items.find((i) => i.product.id === product.id);
          const nextVariants = buildUnitVariants(qty, unitVariants);
          const items = existing
            ? state.items.map((i) =>
                i.product.id === product.id
                  ? {
                      ...i,
                      quantity: i.quantity + qty,
                      unitVariants: [...i.unitVariants, ...nextVariants],
                    }
                  : i
              )
            : [...state.items, { product, quantity: qty, unitVariants: nextVariants }];

          return {
            items,
            item: syncCheckoutItemWithCart(items, state.item),
          };
        }),

      removeItem: (productId) =>
        set((state) => {
          const items = state.items.filter((i) => i.product.id !== productId);

          return {
            items,
            item: syncCheckoutItemWithCart(items, state.item),
          };
        }),

      updateQuantity: (productId, delta) =>
        set((state) => {
          const items = state.items
            .map((i) => {
              if (i.product.id !== productId) {
                return i;
              }

              const nextQuantity = i.quantity + delta;
              if (nextQuantity <= 0) {
                return { ...i, quantity: nextQuantity };
              }

              if (delta > 0) {
                const fallbackVariants = i.unitVariants[i.unitVariants.length - 1] ?? {};
                const extraVariants = Array.from({ length: delta }, () => ({ ...fallbackVariants }));

                return {
                  ...i,
                  quantity: nextQuantity,
                  unitVariants: [...i.unitVariants, ...extraVariants],
                };
              }

              return {
                ...i,
                quantity: nextQuantity,
                unitVariants: i.unitVariants.slice(0, nextQuantity),
              };
            })
            .filter((i) => i.quantity > 0);

          return {
            items,
            item: syncCheckoutItemWithCart(items, state.item),
          };
        }),

      clearCart: () => set({ items: [], item: null }),

      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: 'damiana-bella-cart' }
  )
);
