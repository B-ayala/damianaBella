import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Clock, XCircle, ArrowLeft } from 'lucide-react';
import { useCartStore } from '../../../store/cartStore';
import './CheckoutResult.css';

type ResultStatus = 'approved' | 'pending' | 'failure' | 'unknown';

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
    const clearItem = useCartStore((s) => s.clearItem);

    // MP envía: collection_status=approved|pending|null, status=approved|pending|null
    const mpStatus = params.get('collection_status') ?? params.get('status') ?? '';

    let status: ResultStatus = 'unknown';
    if (mpStatus === 'approved') status = 'approved';
    else if (mpStatus === 'pending' || mpStatus === 'in_process') status = 'pending';
    else if (mpStatus === 'null' || mpStatus === 'rejected' || mpStatus === 'cancelled') status = 'failure';

    useEffect(() => {
        if (status === 'approved') {
            clearItem();
        }
    }, [status, clearItem]);

    const { icon, title, desc, color } = CONTENT[status];

    return (
        <div className="checkout-result-page">
            <div className={`checkout-result-card ${color}`}>
                <div className="checkout-result-icon">{icon}</div>
                <h1 className="checkout-result-title">{title}</h1>
                <p className="checkout-result-desc">{desc}</p>
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
                            onClick={() => navigate(-1)}
                        >
                            <ArrowLeft size={16} /> Volver al checkout
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CheckoutResult;
