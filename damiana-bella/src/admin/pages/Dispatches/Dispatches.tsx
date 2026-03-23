import { useState, useEffect } from 'react';
import { RefreshCw, Package, Truck, Store, User, Mail, SendHorizonal } from 'lucide-react';
import { Box, Pagination } from '@mui/material';
import { supabase } from '../../../config/supabaseClient';
import './Dispatches.css';

type DispatchStatus = 'pendiente' | 'en_preparacion' | 'despachado' | 'listo_para_retiro';
type PaymentStatus = 'pendiente' | 'pagado';

interface Dispatch {
    id: string;
    buyer_name: string | null;
    buyer_email: string | null;
    product_id: number | null;
    product_name: string;
    product_image: string | null;
    quantity: number;
    total_price: number;
    payment_method: string;
    payment_status: PaymentStatus;
    shipping_method: string | null;
    dispatch_status: DispatchStatus;
    created_at: string;
}

const SHIPPING_METHOD_LABEL: Record<string, string> = {
    correo: 'Correo Argentino',
    moto: 'Envío por moto',
    local: 'Retiro en local',
};

const DISPATCH_STATUS_LABEL: Record<DispatchStatus, string> = {
    pendiente: 'Pendiente',
    en_preparacion: 'En preparación',
    despachado: 'Despachado',
    listo_para_retiro: 'Listo para retiro',
};

const ITEMS_PER_PAGE = 10;

function ShippingIcon({ method }: { method: string | null }) {
    if (method === 'correo') return <Package size={14} className="shipping-icon correo" />;
    if (method === 'moto') return <Truck size={14} className="shipping-icon moto" />;
    if (method === 'local') return <Store size={14} className="shipping-icon local" />;
    return <SendHorizonal size={14} className="shipping-icon" />;
}

function nextDispatchStatus(current: DispatchStatus, shippingMethod: string | null): DispatchStatus {
    if (current === 'pendiente') return 'en_preparacion';
    if (current === 'en_preparacion') return shippingMethod === 'local' ? 'listo_para_retiro' : 'despachado';
    return current;
}

const Dispatches = () => {
    const [dispatches, setDispatches] = useState<Dispatch[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterShipping, setFilterShipping] = useState('');
    const [filterDispatch, setFilterDispatch] = useState('');
    const [filterPayment, setFilterPayment] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    const loadDispatches = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('ventas')
                .select('id, buyer_name, buyer_email, product_id, product_name, product_image, quantity, total_price, payment_method, payment_status, shipping_method, dispatch_status, created_at')
                .order('created_at', { ascending: false });

            if (error) throw error;

            const mapped: Dispatch[] = (data ?? []).map((row) => ({
                id: row.id,
                buyer_name: row.buyer_name ?? null,
                buyer_email: row.buyer_email ?? null,
                product_id: row.product_id,
                product_name: row.product_name,
                product_image: row.product_image,
                quantity: row.quantity,
                total_price: row.total_price,
                payment_method: row.payment_method,
                payment_status: row.payment_status,
                shipping_method: row.shipping_method,
                dispatch_status: row.dispatch_status ?? 'pendiente',
                created_at: row.created_at,
            }));
            setDispatches(mapped);
        } catch (err) {
            console.error('Error cargando despachos:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDispatches();
    }, []);

    const handleTogglePaymentStatus = async (d: Dispatch) => {
        const newStatus: PaymentStatus = d.payment_status === 'pendiente' ? 'pagado' : 'pendiente';
        const { error } = await supabase.from('ventas').update({ payment_status: newStatus }).eq('id', d.id);
        if (!error) {
            setDispatches((prev) => prev.map((x) => x.id === d.id ? { ...x, payment_status: newStatus } : x));
        }
    };

    const handleAdvanceDispatch = async (d: Dispatch) => {
        const newStatus = nextDispatchStatus(d.dispatch_status, d.shipping_method);
        if (newStatus === d.dispatch_status) return;
        const { error } = await supabase.from('ventas').update({ dispatch_status: newStatus }).eq('id', d.id);
        if (!error) {
            setDispatches((prev) => prev.map((x) => x.id === d.id ? { ...x, dispatch_status: newStatus } : x));
        }
    };

    const handleChangeDispatchStatus = async (d: Dispatch, newStatus: DispatchStatus) => {
        if (newStatus === d.dispatch_status) return;
        const { error } = await supabase.from('ventas').update({ dispatch_status: newStatus }).eq('id', d.id);
        if (!error) {
            setDispatches((prev) => prev.map((x) => x.id === d.id ? { ...x, dispatch_status: newStatus } : x));
        }
    };

    // Filters
    let filtered = dispatches;
    if (filterShipping) filtered = filtered.filter((d) => d.shipping_method === filterShipping);
    if (filterDispatch) filtered = filtered.filter((d) => d.dispatch_status === filterDispatch);
    if (filterPayment) filtered = filtered.filter((d) => d.payment_status === filterPayment);

    const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
    const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const formatDate = (iso: string) => {
        const d = new Date(iso);
        return (
            d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
            ' ' +
            d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
        );
    };

    const formatPrice = (n: number) =>
        '$' + n.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

    const countBy = (status: DispatchStatus) => dispatches.filter((d) => d.dispatch_status === status).length;
    const countDispatched = dispatches.filter((d) => d.dispatch_status === 'despachado' || d.dispatch_status === 'listo_para_retiro').length;

    return (
        <div className="admin-dispatches-page">
            <div className="admin-page-header admin-flex-between">
                <div>
                    <h1 className="admin-page-title">Despachos</h1>
                    <p className="admin-page-subtitle">Gestioná el estado de preparación y envío de cada pedido.</p>
                </div>
                <button className="dispatch-btn-secondary admin-flex-center gap-2" onClick={loadDispatches}>
                    <RefreshCw size={16} /> Actualizar
                </button>
            </div>

            {/* Filters */}
            <div className="admin-card dispatch-toolbar">
                <div className="toolbar-filters">
                    <select
                        className="filter-select"
                        value={filterShipping}
                        onChange={(e) => { setFilterShipping(e.target.value); setCurrentPage(1); }}
                    >
                        <option value="">Todos los envíos</option>
                        <option value="correo">Correo Argentino</option>
                        <option value="moto">Envío por moto</option>
                        <option value="local">Retiro en local</option>
                    </select>
                    <select
                        className="filter-select"
                        value={filterDispatch}
                        onChange={(e) => { setFilterDispatch(e.target.value); setCurrentPage(1); }}
                    >
                        <option value="">Todos los estados</option>
                        <option value="pendiente">Pendiente</option>
                        <option value="en_preparacion">En preparación</option>
                        <option value="despachado">Despachado</option>
                        <option value="listo_para_retiro">Listo para retiro</option>
                    </select>
                    <select
                        className="filter-select"
                        value={filterPayment}
                        onChange={(e) => { setFilterPayment(e.target.value); setCurrentPage(1); }}
                    >
                        <option value="">Todos los pagos</option>
                        <option value="pendiente">Pago pendiente</option>
                        <option value="pagado">Pagado</option>
                    </select>
                </div>
            </div>

            {/* Summary */}
            <div className="dispatch-summary">
                <div className="dispatch-badge total">
                    <span className="dispatch-badge-value">{dispatches.length}</span>
                    <span className="dispatch-badge-label">Total pedidos</span>
                </div>
                <div className="dispatch-badge pend">
                    <span className="dispatch-badge-value">{countBy('pendiente')}</span>
                    <span className="dispatch-badge-label">Pendientes</span>
                </div>
                <div className="dispatch-badge prep">
                    <span className="dispatch-badge-value">{countBy('en_preparacion')}</span>
                    <span className="dispatch-badge-label">En preparación</span>
                </div>
                <div className="dispatch-badge done">
                    <span className="dispatch-badge-value">{countDispatched}</span>
                    <span className="dispatch-badge-label">Despachados / Listos</span>
                </div>
            </div>

            {/* Content */}
            <div className="admin-card table-card">
                {loading ? (
                    <p className="dispatch-loading">Cargando despachos...</p>
                ) : filtered.length === 0 ? (
                    <div className="dispatch-empty-state">
                        <SendHorizonal size={48} className="dispatch-empty-icon" />
                        <p className="dispatch-empty-title">
                            {filterShipping || filterDispatch || filterPayment
                                ? 'No hay pedidos que coincidan con los filtros'
                                : 'Todavía no hay pedidos registrados'}
                        </p>
                        <p className="dispatch-empty-subtitle">
                            {filterShipping || filterDispatch || filterPayment
                                ? 'Probá con otros criterios o limpiá los filtros.'
                                : 'Los pedidos aparecerán aquí cuando los clientes completen una compra.'}
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Mobile cards */}
                        <div className="dispatch-card-list">
                            {paginated.map((d) => {
                                const isTerminal =
                                    d.dispatch_status === 'despachado' || d.dispatch_status === 'listo_para_retiro';
                                return (
                                    <div className="dispatch-card" key={d.id}>
                                        <div className="dispatch-card-buyer">
                                            <div className="dispatch-card-buyer-row">
                                                <User size={13} className="dispatch-buyer-icon" />
                                                <span className="dispatch-buyer-name">
                                                    {d.buyer_name ?? <span className="dispatch-buyer-missing">Sin nombre</span>}
                                                </span>
                                            </div>
                                            {d.buyer_email && (
                                                <div className="dispatch-card-buyer-row">
                                                    <Mail size={13} className="dispatch-buyer-icon" />
                                                    <span className="dispatch-buyer-email">{d.buyer_email}</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="dispatch-card-top">
                                            {d.product_image ? (
                                                <img src={d.product_image} alt={d.product_name} className="dispatch-card-img" />
                                            ) : (
                                                <div className="dispatch-card-img-placeholder" />
                                            )}
                                            <div className="dispatch-card-info">
                                                <span className="dispatch-card-name">{d.product_name}</span>
                                                <span className="dispatch-card-date">{formatDate(d.created_at)}</span>
                                            </div>
                                        </div>
                                        <div className="dispatch-card-body">
                                            <div className="dispatch-card-field">
                                                <span className="field-label">Cant.</span>
                                                <span className="field-value">{d.quantity}</span>
                                            </div>
                                            <div className="dispatch-card-field">
                                                <span className="field-label">Total</span>
                                                <span className="field-value">{formatPrice(d.total_price)}</span>
                                            </div>
                                            <div className="dispatch-card-field">
                                                <span className="field-label">Envío</span>
                                                <span className="field-value dispatch-shipping-cell">
                                                    <ShippingIcon method={d.shipping_method} />
                                                    {d.shipping_method ? (SHIPPING_METHOD_LABEL[d.shipping_method] ?? d.shipping_method) : '—'}
                                                </span>
                                            </div>
                                            <div className="dispatch-card-field">
                                                <span className="field-label">Estado pago</span>
                                                <button
                                                    className={`payment-status-badge ${d.payment_status}`}
                                                    onClick={() => handleTogglePaymentStatus(d)}
                                                    title="Clic para cambiar estado de pago"
                                                >
                                                    {d.payment_status === 'pagado' ? 'Pagado' : 'Pendiente'}
                                                </button>
                                            </div>
                                            <div className="dispatch-card-field full-width">
                                                <span className="field-label">Estado despacho</span>
                                                <div className="dispatch-status-row">
                                                    <span className={`dispatch-status-badge ${d.dispatch_status}`}>
                                                        {DISPATCH_STATUS_LABEL[d.dispatch_status]}
                                                    </span>
                                                    {!isTerminal && (
                                                        <button
                                                            className="dispatch-advance-btn"
                                                            onClick={() => handleAdvanceDispatch(d)}
                                                            title="Avanzar al siguiente estado"
                                                        >
                                                            Avanzar
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Desktop table */}
                        <table className="admin-table dispatch-table">
                            <thead>
                                <tr>
                                    <th>Comprador</th>
                                    <th>Producto</th>
                                    <th>Fecha</th>
                                    <th>Envío</th>
                                    <th>Estado pago</th>
                                    <th>Estado despacho</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginated.map((d) => (
                                    <tr key={d.id}>
                                        <td>
                                            <div className="table-buyer-cell">
                                                <span className="table-buyer-name">
                                                    {d.buyer_name ?? <span className="dispatch-buyer-missing">—</span>}
                                                </span>
                                                {d.buyer_email && (
                                                    <span className="table-buyer-email">{d.buyer_email}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="table-product-cell">
                                                {d.product_image ? (
                                                    <img src={d.product_image} alt={d.product_name} className="table-img" />
                                                ) : (
                                                    <div className="table-img-placeholder" />
                                                )}
                                                <span>{d.product_name}</span>
                                            </div>
                                        </td>
                                        <td className="date-cell">{formatDate(d.created_at)}</td>
                                        <td>
                                            <span className="dispatch-shipping-cell">
                                                <ShippingIcon method={d.shipping_method} />
                                                {d.shipping_method ? (SHIPPING_METHOD_LABEL[d.shipping_method] ?? d.shipping_method) : '—'}
                                            </span>
                                        </td>
                                        <td>
                                            <button
                                                className={`payment-status-badge ${d.payment_status}`}
                                                onClick={() => handleTogglePaymentStatus(d)}
                                                title="Clic para cambiar estado de pago"
                                            >
                                                {d.payment_status === 'pagado' ? 'Pagado' : 'Pendiente'}
                                            </button>
                                        </td>
                                        <td>
                                            <select
                                                className={`dispatch-status-select ${d.dispatch_status}`}
                                                value={d.dispatch_status}
                                                onChange={(e) =>
                                                    handleChangeDispatchStatus(d, e.target.value as DispatchStatus)
                                                }
                                            >
                                                <option value="pendiente">Pendiente</option>
                                                <option value="en_preparacion">En preparación</option>
                                                {d.shipping_method === 'local' ? (
                                                    <option value="listo_para_retiro">Listo para retiro</option>
                                                ) : (
                                                    <option value="despachado">Despachado</option>
                                                )}
                                            </select>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {totalPages > 1 && (
                            <Box display="flex" justifyContent="center" alignItems="center" pt={1} pb={0.5}>
                                <Pagination
                                    count={totalPages}
                                    page={currentPage}
                                    onChange={(_, page) => setCurrentPage(page)}
                                    size="small"
                                    siblingCount={1}
                                    boundaryCount={1}
                                    color="primary"
                                />
                            </Box>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default Dispatches;
