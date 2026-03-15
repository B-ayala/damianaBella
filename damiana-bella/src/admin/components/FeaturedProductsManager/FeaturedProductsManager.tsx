import { useState } from 'react';
import { Search, Plus, Trash2 } from 'lucide-react';
import { useAdminStore } from '../../store/adminStore';
import './FeaturedProductsManager.css';

const FeaturedProductsManager = () => {
    const { products, featuredProductIds, addFeaturedProduct, removeFeaturedProduct } = useAdminStore();
    const [searchTerm, setSearchTerm] = useState('');

    const featuredProducts = products.filter((p) => featuredProductIds.includes(p.id));
    
    // search results logic
    const searchResults = searchTerm.trim() 
        ? products.filter((p) => 
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
            !featuredProductIds.includes(p.id)
          )
        : [];

    return (
        <div className="admin-card featured-manager">
            <h2 className="admin-card-title">Productos Destacados</h2>
            <p className="admin-card-desc">Selecciona los productos que aparecerán en el home.</p>

            <div className="featured-search-container">
                <div className="search-input-wrapper">
                    <Search size={18} className="search-icon" />
                    <input 
                        type="text" 
                        placeholder="Buscar productos para destacar..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                
                {searchResults.length > 0 && (
                    <div className="search-results-dropdown">
                        {searchResults.map((prod) => (
                            <div key={prod.id} className="search-result-item">
                                {prod.imageUrl ? (
                                    <img src={prod.imageUrl} alt={prod.name} />
                                ) : (
                                    <div className="placeholder-img"></div>
                                )}
                                <div className="result-info">
                                    <span className="result-name">{prod.name}</span>
                                    <span className="result-price">${prod.price}</span>
                                </div>
                                <button 
                                    className="admin-btn-secondary"
                                    onClick={() => {
                                        addFeaturedProduct(prod.id);
                                        setSearchTerm('');
                                    }}
                                >
                                    <Plus size={16} /> Agregar
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="featured-list">
                {featuredProducts.length === 0 ? (
                    <div className="empty-state">No hay productos destacados.</div>
                ) : (
                    featuredProducts.map((prod) => (
                        <div key={prod.id} className="featured-item">
                            {prod.imageUrl ? (
                                <img src={prod.imageUrl} alt={prod.name} />
                            ) : (
                                <div className="placeholder-img"></div>
                            )}
                            <div className="featured-info">
                                <h4>{prod.name}</h4>
                                <span>{prod.category}</span>
                            </div>
                            <button 
                                className="action-btn delete"
                                onClick={() => removeFeaturedProduct(prod.id)}
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default FeaturedProductsManager;
