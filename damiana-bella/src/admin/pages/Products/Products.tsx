import { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import ProductTable from '../../components/ProductTable/ProductTable';
import ProductModal from '../../components/ProductModal/ProductModal';
import { type AdminProduct } from '../../store/adminStore';
import './Products.css';

const Products = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);

    const handleOpenModal = (product?: AdminProduct) => {
        setEditingProduct(product || null);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingProduct(null);
    };

    return (
        <div className="admin-products-page">
            <div className="admin-page-header admin-flex-between">
                <div>
                    <h1 className="admin-page-title">Productos</h1>
                    <p className="admin-page-subtitle">Administra tu catálogo de productos.</p>
                </div>
                <button className="admin-btn-primary admin-flex-center gap-2" onClick={() => handleOpenModal()}>
                    <Plus size={18} /> Nuevo Producto
                </button>
            </div>

            <div className="admin-card products-toolbar">
                <div className="search-input-wrapper admin-w-full admin-max-w-md">
                    <Search size={18} className="search-icon" />
                    <input 
                        type="text" 
                        placeholder="Buscar por nombre o categoría..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="admin-card table-card">
                <ProductTable onEdit={handleOpenModal} searchTerm={searchTerm} />
            </div>

            <ProductModal 
                isOpen={isModalOpen} 
                onClose={handleCloseModal} 
                product={editingProduct} 
            />
        </div>
    );
};

export default Products;
