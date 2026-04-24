import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CircularProgress, Collapse, Divider } from '@mui/material';
import { FiPackage, FiChevronDown, FiChevronUp, FiShoppingBag } from 'react-icons/fi';
import Modal from '../../../../components/common/Modal/Modal';
import { getUserPurchases, type Purchase } from '../../../../services/orderService';
import { buildCloudinaryUrl } from '../../../../utils/cloudinary';

interface MyPurchasesModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
}

const PAYMENT_METHOD_LABEL: Record<string, string> = {
  mp: 'Mercado Pago',
  transfer: 'Transferencia',
};

const SHIPPING_METHOD_LABEL: Record<string, string> = {
  correo: 'Correo Argentino',
  moto: 'Envío por moto',
  local: 'Retiro en local',
};

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatPrice = (n: number) =>
  `$ ${n.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

const PurchaseItem = ({ purchase, onOpenProduct }: { purchase: Purchase; onOpenProduct: (productId: string | number) => void }) => {
  const [expanded, setExpanded] = useState(false);
  const hasVariants = purchase.units_config && purchase.units_config.length > 0;
  const canOpenProduct = purchase.product_id !== null && String(purchase.product_id).trim() !== '';
  const headerStyles = {
    display: 'flex',
    gap: '1rem',
    padding: '1rem',
    alignItems: 'flex-start',
  } as const;

  return (
    <div
      style={{
        border: '1px solid rgba(184,165,200,0.25)',
        borderRadius: '12px',
        overflow: 'hidden',
        background: 'rgba(184,165,200,0.04)',
      }}
    >
      {/* Header row */}
      {canOpenProduct ? (
        <button
          type="button"
          onClick={() => onOpenProduct(purchase.product_id!)}
          style={{
            ...headerStyles,
            width: '100%',
            border: 'none',
            background: 'none',
            textAlign: 'left',
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
          aria-label={`Ver detalle de ${purchase.product_name}`}
        >
          {/* Image */}
          {purchase.product_image ? (
            <img
              src={buildCloudinaryUrl(purchase.product_image, { width: 72, quality: 'auto', format: 'auto' })}
              alt={purchase.product_name}
              width={72}
              height={72}
              style={{ borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }}
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
            />
          ) : (
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: '8px',
                background: 'rgba(184,165,200,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <FiPackage size={28} color="var(--primary-accent)" />
            </div>
          )}

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                margin: '0 0 0.25rem',
                fontWeight: 600,
                fontSize: '0.95rem',
                color: 'var(--text-dark)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {purchase.product_name}
            </p>
            <p style={{ margin: '0 0 0.25rem', fontSize: '0.82rem', color: '#888' }}>
              {formatDate(purchase.created_at)}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.4rem' }}>
              <span
                style={{
                  fontSize: '0.78rem',
                  padding: '0.2rem 0.6rem',
                  borderRadius: '20px',
                  background: 'rgba(184,165,200,0.15)',
                  color: 'var(--text-dark)',
                }}
              >
                {purchase.quantity} {purchase.quantity === 1 ? 'unidad' : 'unidades'}
              </span>
              {purchase.shipping_method && (
                <span
                  style={{
                    fontSize: '0.78rem',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '20px',
                    background: 'rgba(184,165,200,0.15)',
                    color: 'var(--text-dark)',
                  }}
                >
                  {SHIPPING_METHOD_LABEL[purchase.shipping_method] ?? purchase.shipping_method}
                </span>
              )}
              <span
                style={{
                  fontSize: '0.78rem',
                  padding: '0.2rem 0.6rem',
                  borderRadius: '20px',
                  background: 'rgba(184,165,200,0.15)',
                  color: 'var(--text-dark)',
                }}
              >
                {PAYMENT_METHOD_LABEL[purchase.payment_method] ?? purchase.payment_method}
              </span>
            </div>
          </div>

          {/* Prices */}
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <p style={{ margin: '0 0 0.15rem', fontSize: '0.8rem', color: '#888' }}>
              {formatPrice(purchase.unit_price)} c/u
            </p>
            <p style={{ margin: 0, fontWeight: 700, fontSize: '1rem', color: 'var(--primary-accent)' }}>
              {formatPrice(purchase.total_price)}
            </p>
          </div>
        </button>
      ) : (
        <div style={headerStyles}>
          {/* Image */}
          {purchase.product_image ? (
            <img
              src={buildCloudinaryUrl(purchase.product_image, { width: 72, quality: 'auto', format: 'auto' })}
              alt={purchase.product_name}
              width={72}
              height={72}
              style={{ borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }}
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
            />
          ) : (
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: '8px',
                background: 'rgba(184,165,200,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <FiPackage size={28} color="var(--primary-accent)" />
            </div>
          )}

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                margin: '0 0 0.25rem',
                fontWeight: 600,
                fontSize: '0.95rem',
                color: 'var(--text-dark)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {purchase.product_name}
            </p>
            <p style={{ margin: '0 0 0.25rem', fontSize: '0.82rem', color: '#888' }}>
              {formatDate(purchase.created_at)}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.4rem' }}>
              <span
                style={{
                  fontSize: '0.78rem',
                  padding: '0.2rem 0.6rem',
                  borderRadius: '20px',
                  background: 'rgba(184,165,200,0.15)',
                  color: 'var(--text-dark)',
                }}
              >
                {purchase.quantity} {purchase.quantity === 1 ? 'unidad' : 'unidades'}
              </span>
              {purchase.shipping_method && (
                <span
                  style={{
                    fontSize: '0.78rem',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '20px',
                    background: 'rgba(184,165,200,0.15)',
                    color: 'var(--text-dark)',
                  }}
                >
                  {SHIPPING_METHOD_LABEL[purchase.shipping_method] ?? purchase.shipping_method}
                </span>
              )}
              <span
                style={{
                  fontSize: '0.78rem',
                  padding: '0.2rem 0.6rem',
                  borderRadius: '20px',
                  background: 'rgba(184,165,200,0.15)',
                  color: 'var(--text-dark)',
                }}
              >
                {PAYMENT_METHOD_LABEL[purchase.payment_method] ?? purchase.payment_method}
              </span>
            </div>
          </div>

          {/* Prices */}
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <p style={{ margin: '0 0 0.15rem', fontSize: '0.8rem', color: '#888' }}>
              {formatPrice(purchase.unit_price)} c/u
            </p>
            <p style={{ margin: 0, fontWeight: 700, fontSize: '1rem', color: 'var(--primary-accent)' }}>
              {formatPrice(purchase.total_price)}
            </p>
          </div>
        </div>
      )}

      {/* Expand button for variants */}
      {hasVariants && (
        <>
          <Divider sx={{ borderColor: 'rgba(184,165,200,0.2)' }} />
          <button
            onClick={() => setExpanded((v) => !v)}
            style={{
              width: '100%',
              background: 'none',
              border: 'none',
              padding: '0.6rem 1rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.82rem',
              color: 'var(--primary-accent)',
              fontWeight: 500,
              fontFamily: 'inherit',
            }}
          >
            <span>{expanded ? 'Ocultar detalle de variantes' : 'Ver detalle de variantes'}</span>
            {expanded ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
          </button>

          <Collapse in={expanded}>
            <div style={{ padding: '0 1rem 1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {purchase.units_config!.map((unit, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      gap: '0.5rem',
                      flexWrap: 'wrap',
                      fontSize: '0.83rem',
                      color: 'var(--text-dark)',
                    }}
                  >
                    <span style={{ color: '#888', minWidth: '4rem' }}>Ud. {idx + 1}:</span>
                    {Object.entries(unit).map(([key, val]) => (
                      <span key={key}>
                        <span style={{ textTransform: 'capitalize', color: '#888' }}>{key}:</span>{' '}
                        <strong>{val}</strong>
                      </span>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </Collapse>
        </>
      )}
    </div>
  );
};

const MyPurchasesModal = ({ isOpen, onClose, email }: MyPurchasesModalProps) => {
  const navigate = useNavigate();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openPurchasedProduct = (productId: string | number) => {
    onClose();
    navigate(`/product/${String(productId)}`);
  };

  useEffect(() => {
    if (!isOpen || !email) return;
    setLoading(true);
    setError(null);
    getUserPurchases(email)
      .then(setPurchases)
      .catch(() => setError('No se pudieron cargar tus compras. Intentá más tarde.'))
      .finally(() => setLoading(false));
  }, [isOpen, email]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Mis compras">
      <div style={{ paddingTop: '0.5rem' }}>
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
            <CircularProgress size={36} sx={{ color: 'var(--primary-accent)' }} />
          </div>
        )}

        {!loading && error && (
          <p style={{ textAlign: 'center', color: '#c0392b', padding: '1rem 0' }}>{error}</p>
        )}

        {!loading && !error && purchases.length === 0 && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1rem',
              padding: '2.5rem 1rem',
              color: '#999',
            }}
          >
            <FiShoppingBag size={48} style={{ opacity: 0.35 }} />
            <p style={{ margin: 0, fontSize: '1rem', textAlign: 'center' }}>
              Aún no realizaste compras.
            </p>
          </div>
        )}

        {!loading && !error && purchases.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <p style={{ margin: '0 0 0.5rem', fontSize: '0.85rem', color: '#999' }}>
              {purchases.length} {purchases.length === 1 ? 'compra realizada' : 'compras realizadas'}
            </p>
            {purchases.map((p) => (
              <PurchaseItem key={p.id} purchase={p} onOpenProduct={openPurchasedProduct} />
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default MyPurchasesModal;
