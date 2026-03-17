import { useState, useEffect } from 'react';
import { Plus, Search } from 'lucide-react';
import ProductTable from '../../components/ProductTable/ProductTable';
import ProductModal from '../../components/ProductModal/ProductModal';
import { useAdminStore, type AdminProduct } from '../../store/adminStore';
import { fetchProducts } from '../../../services/productService';
import './Products.css';

const Products = () => {
    const { setProducts } = useAdminStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadProducts = async () => {
            try {
                const data = await fetchProducts();
                // Mapear snake_case de la DB a camelCase del store
                const mapped: AdminProduct[] = data.map((p: Record<string, unknown>) => ({
                    id: String(p.id),
                    name: p.name as string,
                    price: p.price as number,
                    stock: p.stock as number,
                    category: (p.category as string) || '',
                    imageUrl: (p.image_url as string) || '',
                    description: (p.description as string) || undefined,
                    discount: (p.discount as number) || undefined,
                    condition: (p.condition as 'new' | 'used') || 'new',
                    freeShipping: (p.free_shipping as boolean) || false,
                    variants: (p.variants as AdminProduct['variants']) || undefined,
                    specifications: (p.specifications as AdminProduct['specifications']) || undefined,
                    features: (p.features as string[]) || undefined,
                    faqs: (p.faqs as AdminProduct['faqs']) || undefined,
                    warranty: (p.warranty as string) || undefined,
                    returnPolicy: (p.return_policy as string) || undefined,
                    status: (p.status as 'active' | 'inactive') || 'active',
                }));
                setProducts(mapped);
            } catch (err) {
                console.error('Error cargando productos:', err);
            } finally {
                setLoading(false);
            }
        };
        loadProducts();
    }, [setProducts]);

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
                {loading ? (
                    <p style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>Cargando productos...</p>
                ) : (
                    <ProductTable onEdit={handleOpenModal} searchTerm={searchTerm} />
                )}
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
