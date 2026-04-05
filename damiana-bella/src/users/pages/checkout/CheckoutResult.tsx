import { useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Clock, XCircle } from 'lucide-react';
import { useCartStore } from '../../../store/cartStore';
import { cancelMpOrder } from '../../../services/orderService';
import { useInitialLoadTask } from '../../../components/common/InitialLoad/InitialLoadProvider';
import './CheckoutResult.css';

type ResultStatus = 'approved' | 'pending' | 'failure' | 'unknown';

interface LastOrderItem {
    productName: string;
    productImage: string;
    quantity: number;
    totalPrice: number;
}

interface LastOrder {
    items: LastOrderItem[];
    itemsSubtotal?: number;
    grandTotal: number;
    source?: 'cart' | 'direct';
}

const CONTENT: Record<ResultStatus, { icon: React.ReactNode; title: string; desc: string; color: string }> = {
    approved: {
        icon: <CheckCircle size={56} />,
        title: '¡Pago aprobado!',
        desc: 'Tu pedido fue registrado y el pago fue confirmado. Te avisaremos cuando tu pedido esté en camino.',
        color: 'approved',
    },
    pending: {
        icon: <Clock size={56} />,
        title: 'Pago en proceso',
        desc: 'Tu pago está siendo procesado. Una vez confirmado, el pedido se registrará automáticamente.',
        color: 'pending',
    },
    failure: {
        icon: <XCircle size={56} />,
        title: 'El pago no se pudo completar',
        desc: 'Hubo un problema al procesar el pago. Podés intentarlo de nuevo o elegir transferencia bancaria.',
        color: 'failure',
    },
    unknown: {
        icon: <Clock size={56} />,
        title: 'Estado desconocido',
        desc: 'No pudimos determinar el estado del pago. Revisá tu cuenta de Mercado Pago para más información.',
        color: 'pending',
    },
};

const CheckoutResult = () => {
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const setItem = useCartStore((s) => s.setItem);
    const clearCart = useCartStore((s) => s.clearCart);
    const [lastOrder, setLastOrder] = useState<LastOrder | null>(null);
    const cancelledRef = useRef(false);

    // MP envía: collection_status=approved|pending|null, status=approved|pending|null, external_reference=order_id
    const mpStatus = params.get('collection_status') ?? params.get('status') ?? '';
    const externalRef = params.get('external_reference') ?? '';

    useInitialLoadTask('route', false);

    let status: ResultStatus = 'unknown';
    if (mpStatus === 'approved') status = 'approved';
    else if (mpStatus === 'pending' || mpStatus === 'in_process') status = 'pending';
    else if (mpStatus === 'null' || mpStatus === 'rejected' || mpStatus === 'cancelled') status = 'failure';

    useEffect(() => {
        const raw = sessionStorage.getItem('mp_last_order');
        if (raw) {
            try { setLastOrder(JSON.parse(raw)); } catch { /* ignore */ }
            sessionStorage.removeItem('mp_last_order');
        }

        if (status === 'approved') {
            sessionStorage.removeItem('mp_order_ids');

            let source: LastOrder['source'] | undefined;
            if (raw) {
                try {
                    source = (JSON.parse(raw) as LastOrder).source;
                } catch {
                    source = undefined;
                }
            }

            if (source === 'cart') {
                clearCart();
            } else {
                setItem(null);
            }
        } else if (status === 'failure') {
            const storedOrderIds = sessionStorage.getItem('mp_order_ids');
            sessionStorage.removeItem('mp_order_ids');

            let orderIds = externalRef ? externalRef.split(',').map((id) => id.trim()).filter(Boolean) : [];
            if (orderIds.length === 0 && storedOrderIds) {
                try {
                    const parsedIds = JSON.parse(storedOrderIds);
                    if (Array.isArray(parsedIds)) {
                        orderIds = parsedIds.map((id) => String(id));
                    }
                } catch {
                    orderIds = [];
                }
            }

            if (orderIds.length > 0 && !cancelledRef.current) {
                cancelledRef.current = true;
                orderIds.forEach((orderId) => {
                    cancelMpOrder(orderId);
                });
            }
        }
    }, [clearCart, externalRef, setItem, status]);

    const { icon, title, desc, color } = CONTENT[status];
    const fmt = (n: number) => n.toLocaleString('es-AR', { minimumFractionDigits: 2 });

    return (
        <div className="checkout-result-page">
            <div className={`checkout-result-card ${color}`}>
                <div className="checkout-result-icon">{icon}</div>
                <h1 className="checkout-result-title">{title}</h1>
                <p className="checkout-result-desc">{desc}</p>

                {lastOrder && (status === 'approved' || status === 'pending' || status === 'failure') && (
                    <div className="checkout-result-products">
                        {lastOrder.items.map((orderItem, index) => (
                            <div key={`${orderItem.productName}-${index}`} className="checkout-result-product">
                                <img
                                    src={orderItem.productImage}
                                    alt={orderItem.productName}
                                    className="checkout-result-product-img"
                                />
                                <div className="checkout-result-product-info">
                                    <p className="checkout-result-product-name">{orderItem.productName}</p>
                                    <p className="checkout-result-product-qty">Cantidad: {orderItem.quantity}</p>
                                    <p className="checkout-result-product-total">Subtotal: ${fmt(orderItem.totalPrice)}</p>
                                </div>
                            </div>
                        ))}
                        <div className="checkout-result-totals">
                            {typeof lastOrder.itemsSubtotal === 'number' && (
                                <p className="checkout-result-total-line">Subtotal productos: ${fmt(lastOrder.itemsSubtotal)}</p>
                            )}
                            <p className="checkout-result-total-line checkout-result-total-line--grand">Total: ${fmt(lastOrder.grandTotal)}</p>
                        </div>
                    </div>
                )}

                <div className="checkout-result-actions">
                    <button
                        className="checkout-result-btn primary"
                        onClick={() => navigate('/products')}
                    >
                        Ver más productos
                    </button>
                    {status === 'failure' && (
                        <button
                            className="checkout-result-btn secondary"
                            onClick={() => navigate('/checkout')}
                        >
                            Volver al checkout
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CheckoutResult;
