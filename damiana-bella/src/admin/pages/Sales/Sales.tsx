import { useState, useEffect } from 'react';
import { Search, RefreshCw, ShoppingBag, User, Mail } from 'lucide-react';
import { Box, InputAdornment, MenuItem, Pagination, TextField } from '@mui/material';
import { supabase } from '../../../config/supabaseClient';
import './Sales.css';

interface StockAlert {
    id: number;
    name: string;
    image_url: string | null;
    stock: number;
    category: string | null;
}

interface Sale {
    id: string;
    buyer_name: string | null;
    buyer_email: string | null;
    product_id: number | null;
    product_name: string;
    product_image: string | null;
    quantity: number;
    unit_price: number;
    total_price: number;
    units_config: Record<string, string>[] | null;
    payment_method: string;
    payment_status: 'pendiente' | 'pagado' | 'fallido' | 'expirado' | 'cancelado';
    shipping_method: string | null;
    created_at: string;
    // joined from productos
    current_stock?: number;
}

const PAYMENT_METHOD_LABEL: Record<string, string> = {
    mp: 'Mercado Pago',
    transfer: 'Transferencia',
};

const PAYMENT_STATUS_LABEL: Record<string, string> = {
    pendiente: 'Pendiente',
    pagado: 'Pagado',
    fallido: 'Fallido',
    expirado: 'Expirado',
    cancelado: 'Cancelado',
};

const EXPIRY_MS = 15 * 60 * 1000;

// Trata como expirado a órdenes MP pendientes con más de 15 min (UI-only, antes de que corra el cron)
const getEffectiveStatus = (sale: Sale): Sale['payment_status'] => {
    if (
        sale.payment_method === 'mp' &&
        sale.payment_status === 'pendiente' &&
        Date.now() - new Date(sale.created_at).getTime() > EXPIRY_MS
    ) return 'expirado';
    return sale.payment_status;
};

const SHIPPING_METHOD_LABEL: Record<string, string> = {
    correo: 'Correo Argentino',
    moto: 'Envío por moto',
    local: 'Retiro en local',
};

const ITEMS_PER_PAGE = 10;

const filterSelectSlotProps = {
    select: {
        displayEmpty: true,
    },
} as const;

const Sales = () => {
    const [sales, setSales] = useState<Sale[]>([]);
    const [stockAlerts, setStockAlerts] = useState<StockAlert[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterPaymentStatus, setFilterPaymentStatus] = useState('');
    const [filterStock, setFilterStock] = useState('');
    const [filterPaymentMethod, setFilterPaymentMethod] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    const loadSales = async () => {
        setLoading(true);
        try {
            const { data: ventasData, error } = await supabase
                .from('ventas')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Fetch current stock for all unique product_ids
            const productIds = [...new Set((ventasData ?? []).map((r) => r.product_id).filter(Boolean))];
            const stockMap: Record<number, number> = {};
            if (productIds.length > 0) {
                const { data: productosData } = await supabase
                    .from('productos')
                    .select('id, stock')
                    .in('id', productIds);
                (productosData ?? []).forEach((p) => { stockMap[p.id] = p.stock; });
            }

            const mapped: Sale[] = (ventasData ?? []).map((row) => ({
                id: row.id,
                buyer_name: row.buyer_name ?? null,
                buyer_email: row.buyer_email ?? null,
                product_id: row.product_id,
                product_name: row.product_name,
                product_image: row.product_image,
                quantity: row.quantity,
                unit_price: row.unit_price,
                total_price: row.total_price,
                units_config: row.units_config,
                payment_method: row.payment_method,
                payment_status: row.payment_status,
                shipping_method: row.shipping_method,
                created_at: row.created_at,
                current_stock: row.product_id != null ? stockMap[row.product_id] : undefined,
            }));
            setSales(mapped);

            // Stock alerts: products with stock <= 5
            const { data: alertsData } = await supabase
                .from('productos')
                .select('id, name, image_url, stock, category')
                .eq('status', 'active')
                .lte('stock', 5)
                .order('stock', { ascending: true });
            setStockAlerts(alertsData ?? []);
        } catch (err) {
            console.error('Error cargando ventas:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSales();
    }, []);

    const handleTogglePaymentStatus = async (sale: Sale) => {
        // Solo las órdenes de transferencia se gestionan manualmente
        if (sale.payment_method !== 'transfer') return;
        const effectiveStatus = getEffectiveStatus(sale);
        if (effectiveStatus === 'fallido' || effectiveStatus === 'expirado' || effectiveStatus === 'cancelado') return;
        const newStatus = effectiveStatus === 'pendiente' ? 'pagado' : 'pendiente';
        const { error } = await supabase
            .from('ventas')
            .update({ payment_status: newStatus })
            .eq('id', sale.id);
        if (!error) {
            setSales((prev) =>
                prev.map((s) => s.id === sale.id ? { ...s, payment_status: newStatus } : s)
            );
        }
    };

    // Filters
    let filtered = sales;

    if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter((s) =>
            s.product_name.toLowerCase().includes(term) ||
            (s.buyer_name ?? '').toLowerCase().includes(term) ||
            (s.buyer_email ?? '').toLowerCase().includes(term)
        );
    }
    if (filterPaymentStatus) {
        filtered = filtered.filter((s) => getEffectiveStatus(s) === filterPaymentStatus);
    }
    if (filterPaymentMethod) {
        filtered = filtered.filter((s) => s.payment_method === filterPaymentMethod);
    }
    if (filterStock === 'out_of_stock') {
        filtered = filtered.filter((s) => s.current_stock === 0);
    } else if (filterStock === 'low_stock') {
        filtered = filtered.filter((s) => s.current_stock !== undefined && s.current_stock > 0 && s.current_stock <= 5);
    }

    const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
    const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const formatDate = (iso: string) => {
        const d = new Date(iso);
        return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
            ' ' + d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    };

    const formatPrice = (n: number) =>
        '$' + n.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

    return (
        <div className="admin-sales-page">
            <div className="admin-page-header admin-flex-between">
                <div>
                    <h1 className="admin-page-title">Ventas</h1>
                    <p className="admin-page-subtitle">Historial de productos vendidos y estado de pagos.</p>
                </div>
                <button className="admin-btn-secondary admin-flex-center gap-2" onClick={loadSales}>
                    <RefreshCw size={16} /> Actualizar
                </button>
            </div>

            {/* Toolbar */}
            <div className="admin-card sales-toolbar">
                <div className="search-input-wrapper">
                    <TextField
                        placeholder="Buscar por producto, comprador o email..."
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        fullWidth
                        size="small"
                        slotProps={{
                            input: {
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Search size={18} />
                                    </InputAdornment>
                                ),
                            },
                        }}
                    />
                </div>
                <div className="toolbar-filters">
                    <TextField
                        select
                        className="filter-select"
                        value={filterPaymentStatus}
                        onChange={(e) => { setFilterPaymentStatus(e.target.value); setCurrentPage(1); }}
                        fullWidth
                        size="small"
                        slotProps={filterSelectSlotProps}
                    >
                        <MenuItem value="">Todos los pagos</MenuItem>
                        <MenuItem value="pendiente">Pendiente</MenuItem>
                        <MenuItem value="pagado">Pagado</MenuItem>
                        <MenuItem value="expirado">Expirado</MenuItem>
                        <MenuItem value="fallido">Fallido</MenuItem>
                    </TextField>
                    <TextField
                        select
                        className="filter-select"
                        value={filterPaymentMethod}
                        onChange={(e) => { setFilterPaymentMethod(e.target.value); setCurrentPage(1); }}
                        fullWidth
                        size="small"
                        slotProps={filterSelectSlotProps}
                    >
                        <MenuItem value="">Todos los métodos</MenuItem>
                        <MenuItem value="mp">Mercado Pago</MenuItem>
                        <MenuItem value="transfer">Transferencia</MenuItem>
                    </TextField>
                    <TextField
                        select
                        className="filter-select"
                        value={filterStock}
                        onChange={(e) => { setFilterStock(e.target.value); setCurrentPage(1); }}
                        fullWidth
                        size="small"
                        slotProps={filterSelectSlotProps}
                    >
                        <MenuItem value="">Todo el stock</MenuItem>
                        <MenuItem value="low_stock">Stock bajo (≤5)</MenuItem>
                        <MenuItem value="out_of_stock">Sin stock</MenuItem>
                    </TextField>
                </div>
            </div>

            {/* Summary badges */}
            <div className="sales-summary">
                <div className="summary-badge total">
                    <span className="summary-value">{sales.filter(s => s.payment_status === 'pagado').length}</span>
                    <span className="summary-label">Total ventas</span>
                </div>
                <div className="summary-badge pending">
                    <span className="summary-value">{sales.filter(s => getEffectiveStatus(s) === 'pendiente').length}</span>
                    <span className="summary-label">Pendientes de pago</span>
                </div>
                <div className="summary-badge paid">
                    <span className="summary-value">{sales.filter(s => s.payment_status === 'pagado').length}</span>
                    <span className="summary-label">Pagadas</span>
                </div>
                <div className="summary-badge no-stock">
                    <span className="summary-value">{sales.filter(s => s.current_stock === 0).length}</span>
                    <span className="summary-label">Con producto sin stock</span>
                </div>
            </div>

            {/* Stock alerts */}
            {stockAlerts.length > 0 && (
                <div className="admin-card stock-alerts-card">
                    <h2 className="stock-alerts-title">Alertas de stock</h2>
                    <div className="stock-alerts-list">
                        {stockAlerts.map((p) => (
                            <div key={p.id} className={`stock-alert-row ${p.stock === 0 ? 'out' : 'low'}`}>
                                {p.image_url ? (
                                    <img src={p.image_url} alt={p.name} className="stock-alert-img" />
                                ) : (
                                    <div className="stock-alert-img-placeholder" />
                                )}
                                <span className="stock-alert-name">{p.name}</span>
                                {p.category && <span className="stock-alert-category">{p.category}</span>}
                                <span className={`stock-badge ${p.stock === 0 ? 'out' : 'low'}`}>
                                    {p.stock === 0 ? 'Sin stock' : `Stock: ${p.stock}`}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="admin-card table-card">
                {loading ? (
                    <p className="sales-loading">Cargando ventas...</p>
                ) : filtered.length === 0 ? (
                    <div className="sales-empty-state">
                        <ShoppingBag size={48} className="sales-empty-icon" />
                        <p className="sales-empty-title">
                            {searchTerm || filterPaymentStatus || filterPaymentMethod || filterStock
                                ? 'No hay ventas que coincidan con los filtros'
                                : 'Todavía no hay ventas registradas'}
                        </p>
                        <p className="sales-empty-subtitle">
                            {searchTerm || filterPaymentStatus || filterPaymentMethod || filterStock
                                ? 'Probá con otros criterios de búsqueda o limpiá los filtros.'
                                : 'Las ventas aparecerán aquí en cuanto los clientes completen una compra.'}
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Mobile card list */}
                        <div className="sales-card-list">
                            {paginated.map((sale) => (
                                <div className="sale-card" key={sale.id}>
                                    {/* Buyer info section */}
                                    <div className="sale-card-buyer">
                                        <div className="sale-card-buyer-row">
                                            <User size={13} className="sale-card-buyer-icon" />
                                            <span className="sale-card-buyer-name">
                                                {sale.buyer_name ?? <span className="sale-buyer-missing">Sin nombre</span>}
                                            </span>
                                        </div>
                                        {sale.buyer_email && (
                                            <div className="sale-card-buyer-row">
                                                <Mail size={13} className="sale-card-buyer-icon" />
                                                <span className="sale-card-buyer-email">{sale.buyer_email}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="sale-card-top">
                                        {sale.product_image ? (
                                            <img src={sale.product_image} alt={sale.product_name} className="sale-card-img" />
                                        ) : (
                                            <div className="sale-card-img-placeholder" />
                                        )}
                                        <div className="sale-card-info">
                                            <span className="sale-card-name">{sale.product_name}</span>
                                            <span className="sale-card-date">{formatDate(sale.created_at)}</span>
                                        </div>
                                    </div>
                                    <div className="sale-card-body">
                                        <div className="sale-card-field">
                                            <span className="field-label">Cant.</span>
                                            <span className="field-value">{sale.quantity}</span>
                                        </div>
                                        <div className="sale-card-field">
                                            <span className="field-label">Total</span>
                                            <span className="field-value">{formatPrice(sale.total_price)}</span>
                                        </div>
                                        <div className="sale-card-field">
                                            <span className="field-label">Pago</span>
                                            <span className="field-value">{PAYMENT_METHOD_LABEL[sale.payment_method] ?? sale.payment_method}</span>
                                        </div>
                                        <div className="sale-card-field">
                                            <span className="field-label">Stock actual</span>
                                            <span className={`stock-badge ${sale.current_stock === 0 ? 'out' : sale.current_stock !== undefined && sale.current_stock <= 5 ? 'low' : 'ok'}`}>
                                                {sale.current_stock ?? '—'}
                                            </span>
                                        </div>
                                        <div className="sale-card-field">
                                            <span className="field-label">Estado pago</span>
                                            {sale.payment_method !== 'transfer' || (['fallido', 'expirado', 'cancelado'] as const).includes(getEffectiveStatus(sale) as never) ? (
                                                <span className={`payment-badge ${getEffectiveStatus(sale)}`}>
                                                    {PAYMENT_STATUS_LABEL[getEffectiveStatus(sale)]}
                                                </span>
                                            ) : (
                                                <button
                                                    className={`payment-badge ${getEffectiveStatus(sale)}`}
                                                    onClick={() => handleTogglePaymentStatus(sale)}
                                                    title="Clic para cambiar estado"
                                                >
                                                    {PAYMENT_STATUS_LABEL[getEffectiveStatus(sale)]}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Desktop table */}
                        <table className="admin-table sales-table">
                            <thead>
                                <tr>
                                    <th>Comprador</th>
                                    <th>Producto</th>
                                    <th>Fecha</th>
                                    <th>Cant.</th>
                                    <th>Total</th>
                                    <th>Método pago</th>
                                    <th>Envío</th>
                                    <th>Stock actual</th>
                                    <th>Estado pago</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginated.map((sale) => (
                                    <tr key={sale.id}>
                                        <td>
                                            <div className="table-buyer-cell">
                                                <span className="table-buyer-name">
                                                    {sale.buyer_name ?? <span className="sale-buyer-missing">—</span>}
                                                </span>
                                                {sale.buyer_email && (
                                                    <span className="table-buyer-email">{sale.buyer_email}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="table-product-cell">
                                                {sale.product_image ? (
                                                    <img src={sale.product_image} alt={sale.product_name} className="table-img" />
                                                ) : (
                                                    <div className="table-img-placeholder" />
                                                )}
                                                <span>{sale.product_name}</span>
                                            </div>
                                        </td>
                                        <td className="date-cell">{formatDate(sale.created_at)}</td>
                                        <td>{sale.quantity}</td>
                                        <td className="font-medium">{formatPrice(sale.total_price)}</td>
                                        <td>{PAYMENT_METHOD_LABEL[sale.payment_method] ?? sale.payment_method}</td>
                                        <td>{sale.shipping_method ? (SHIPPING_METHOD_LABEL[sale.shipping_method] ?? sale.shipping_method) : '—'}</td>
                                        <td>
                                            <span className={`stock-badge ${sale.current_stock === 0 ? 'out' : sale.current_stock !== undefined && sale.current_stock <= 5 ? 'low' : 'ok'}`}>
                                                {sale.current_stock ?? '—'}
                                            </span>
                                        </td>
                                        <td>
                                            {sale.payment_method !== 'transfer' || (['fallido', 'expirado', 'cancelado'] as const).includes(getEffectiveStatus(sale) as never) ? (
                                                <span className={`payment-badge ${getEffectiveStatus(sale)}`}>
                                                    {PAYMENT_STATUS_LABEL[getEffectiveStatus(sale)]}
                                                </span>
                                            ) : (
                                                <button
                                                    className={`payment-badge ${getEffectiveStatus(sale)}`}
                                                    onClick={() => handleTogglePaymentStatus(sale)}
                                                    title="Clic para cambiar estado"
                                                >
                                                    {PAYMENT_STATUS_LABEL[getEffectiveStatus(sale)]}
                                                </button>
                                            )}
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

export default Sales;
