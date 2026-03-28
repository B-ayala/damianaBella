import { supabase } from '../config/supabaseClient';
import { apiFetch } from '../utils/apiFetch';
import type { UnitVariants } from '../store/cartStore';

export interface CreateOrderPayload {
  buyerName: string;
  buyerEmail: string;
  productId: string;
  productName: string;
  productImage: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  unitsConfig: UnitVariants[];
  paymentMethod: string;
  shippingMethod?: string;
}

/** Inserta una venta directamente en Supabase (usado para transferencia bancaria). */
export const createOrder = async (payload: CreateOrderPayload): Promise<void> => {
  try {
    await supabase.from('ventas').insert({
      buyer_name: payload.buyerName || null,
      buyer_email: payload.buyerEmail || null,
      product_id: payload.productId ? Number(payload.productId) : null,
      product_name: payload.productName,
      product_image: payload.productImage,
      quantity: payload.quantity,
      unit_price: payload.unitPrice,
      total_price: payload.totalPrice,
      units_config: payload.unitsConfig,
      payment_method: payload.paymentMethod,
      payment_status: 'pendiente',
      shipping_method: payload.shippingMethod ?? null,
    });
  } catch {
    // Silent — payment flow continues even if order save fails
  }
};

export interface MpPreferenceResult {
  init_point: string;
  order_id: string;
}

/** Llama al backend para crear una preferencia de Mercado Pago y registrar la venta. */
export const createMpPreference = async (
  payload: Omit<CreateOrderPayload, 'paymentMethod'>
): Promise<MpPreferenceResult> => {
  const apiBase = import.meta.env.VITE_API_URL_LOCAL ?? 'http://localhost:3000/api';
  const res = await apiFetch(`${apiBase}/orders/mp-preference`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      buyerName: payload.buyerName,
      buyerEmail: payload.buyerEmail,
      productId: payload.productId,
      productName: payload.productName,
      productImage: payload.productImage,
      quantity: payload.quantity,
      unitPrice: payload.unitPrice,
      totalPrice: payload.totalPrice,
      unitsConfig: payload.unitsConfig,
      shippingMethod: payload.shippingMethod,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? 'Error al crear preferencia de pago');
  }

  const data = await res.json();
  return { init_point: data.init_point, order_id: data.order_id };
};

/** Cancela una orden MP pendiente (usuario volvió sin pagar). Restaura stock en el backend. */
export const cancelMpOrder = async (orderId: string): Promise<void> => {
  const apiBase = import.meta.env.VITE_API_URL_LOCAL ?? 'http://localhost:3000/api';
  await apiFetch(`${apiBase}/orders/${orderId}/cancel`, { method: 'POST' }).catch(() => {
    // Silent — el cron de expiración lo limpiará si falla
  });
};
