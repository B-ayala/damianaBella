import { useState } from 'react';
import { Edit, Trash2, ArrowUpDown } from 'lucide-react';
import { useAdminStore, type AdminProduct } from '../../store/adminStore';
import { StockBadge, StatusBadge } from './ProductBadges';
import './ProductTable.css';

interface ProductTableProps {
    onEdit: (product: AdminProduct) => void;
    searchTerm: string;
}

const ProductTable = ({ onEdit, searchTerm }: ProductTableProps) => {
    const { products, deleteProduct } = useAdminStore();
    const [sortConfig, setSortConfig] = useState<{ key: keyof AdminProduct, direction: 'asc' | 'desc' } | null>(null);

    // Filter by search term
    let filteredProducts = products.filter((p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.category || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Sort
    if (sortConfig !== null) {
        const { key, direction } = sortConfig;
        filteredProducts.sort((a, b) => {
            const aVal = a[key];
            const bVal = b[key];
            if (aVal !== undefined && bVal !== undefined) {
                if (aVal < bVal) return direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return direction === 'asc' ? 1 : -1;
            }
            return 0;
        });
    }

    const requestSort = (key: keyof AdminProduct) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    return (
        <div className="admin-product-table-container">
            {/* Mobile: card layout */}
            <div className="product-card-list">
                {filteredProducts.length === 0 ? (
                    <p className="empty-message">No se encontraron productos.</p>
                ) : (
                    filteredProducts.map((product) => (
                        <div className="product-card" key={product.id}>
                            <div className="product-card-top">
                                {product.imageUrl ? (
                                    <img src={product.imageUrl} alt={product.name} className="product-card-img" />
                                ) : (
                                    <div className="product-card-img-placeholder"></div>
                                )}
                                <div className="product-card-info">
                                    <span className="product-card-name">{product.name}</span>
                                    <span className="product-card-category">{product.category}</span>
                                </div>
                                <div className="product-card-actions">
                                    <button onClick={() => onEdit(product)} className="action-btn edit" title="Editar">
                                        <Edit size={16} />
                                    </button>
                                    <button onClick={() => {
                                        if (window.confirm('¿Eliminar producto?')) {
                                            deleteProduct(product.id);
                                        }
                                    }} className="action-btn delete" title="Eliminar">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                            <div className="product-card-bottom">
                                <div className="product-card-field">
                                    <span className="field-label">Precio</span>
                                    <span className="field-value">${product.price}</span>
                                </div>
                                <div className="product-card-field">
                                    <span className="field-label">Stock</span>
                                    <StockBadge stock={product.stock} />
                                </div>
                                <div className="product-card-field">
                                    <span className="field-label">Estado</span>
                                    <StatusBadge status={product.status} />
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Tablet+: table layout */}
            <table className="admin-table">
                <thead>
                    <tr>
                        <th>Imagen</th>
                        <th onClick={() => requestSort('name')} className="sortable">
                            Nombre <ArrowUpDown size={14} />
                        </th>
                        <th onClick={() => requestSort('price')} className="sortable">
                            Precio <ArrowUpDown size={14} />
                        </th>
                        <th onClick={() => requestSort('stock')} className="sortable">
                            Stock <ArrowUpDown size={14} />
                        </th>
                        <th onClick={() => requestSort('category')} className="sortable">
                            Categoría <ArrowUpDown size={14} />
                        </th>
                        <th>Estado</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredProducts.length === 0 ? (
                        <tr>
                            <td colSpan={7} className="text-center py-4 text-slate-500">No se encontraron productos.</td>
                        </tr>
                    ) : (
                        filteredProducts.map((product) => (
                            <tr key={product.id}>
                                <td>
                                    {product.imageUrl ? (
                                        <img src={product.imageUrl} alt={product.name} className="table-img" />
                                    ) : (
                                        <div className="table-img-placeholder"></div>
                                    )}
                                </td>
                                <td className="font-medium">{product.name}</td>
                                <td>${product.price}</td>
                                <td>
                                    <StockBadge stock={product.stock} />
                                </td>
                                <td>{product.category}</td>
                                <td>
                                    <StatusBadge status={product.status} />
                                </td>
                                <td>
                                    <div className="table-actions">
                                        <button onClick={() => onEdit(product)} className="action-btn edit" title="Editar">
                                            <Edit size={16} />
                                        </button>
                                        <button onClick={() => {
                                            if (window.confirm('¿Eliminar producto?')) {
                                                deleteProduct(product.id);
                                            }
                                        }} className="action-btn delete" title="Eliminar">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default ProductTable;
