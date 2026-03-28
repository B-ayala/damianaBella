import { useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Clock, XCircle } from 'lucide-react';
import { useCartStore } from '../../../store/cartStore';
import { cancelMpOrder } from '../../../services/orderService';
import './CheckoutResult.css';

type ResultStatus = 'approved' | 'pending' | 'failure' | 'unknown';

interface LastOrder {
    productName: string;
    productImage: string;
    quantity: number;
    grandTotal: number;
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
    const [lastOrder, setLastOrder] = useState<LastOrder | null>(null);
    const cancelledRef = useRef(false);

    // MP envía: collection_status=approved|pending|null, status=approved|pending|null, external_reference=order_id
    const mpStatus = params.get('collection_status') ?? params.get('status') ?? '';
    const externalRef = params.get('external_reference') ?? '';

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
            setItem(null);
            sessionStorage.removeItem('mp_order_id');
        } else if (status === 'failure') {
            setItem(null);
            // Cancelar la orden en el backend para marcarla como 'fallido' y restaurar stock
            const orderId = externalRef || sessionStorage.getItem('mp_order_id') || '';
            sessionStorage.removeItem('mp_order_id');
            if (orderId && !cancelledRef.current) {
                cancelledRef.current = true;
                cancelMpOrder(orderId);
            }
        }
    }, [status, setItem, externalRef]);

    const { icon, title, desc, color } = CONTENT[status];
    const fmt = (n: number) => n.toLocaleString('es-AR', { minimumFractionDigits: 2 });

    return (
        <div className="checkout-result-page">
            <div className={`checkout-result-card ${color}`}>
                <div className="checkout-result-icon">{icon}</div>
                <h1 className="checkout-result-title">{title}</h1>
                <p className="checkout-result-desc">{desc}</p>

                {lastOrder && (status === 'approved' || status === 'pending') && (
                    <div className="checkout-result-product">
                        <img
                            src={lastOrder.productImage}
                            alt={lastOrder.productName}
                            className="checkout-result-product-img"
                        />
                        <div className="checkout-result-product-info">
                            <p className="checkout-result-product-name">{lastOrder.productName}</p>
                            <p className="checkout-result-product-qty">Cantidad: {lastOrder.quantity}</p>
                            <p className="checkout-result-product-total">Total: ${fmt(lastOrder.grandTotal)}</p>
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
