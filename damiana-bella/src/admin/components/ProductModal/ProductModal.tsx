import { useState, useEffect } from 'react';
import Modal from '../../../components/common/Modal/Modal';
import { type AdminProduct } from '../../store/adminStore';
import './ProductModal.css';
import './ProductModalStylesExtension.css';

interface ProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: AdminProduct | null;
}

const tabs = ['Datos Básicos', 'Variantes', 'Promociones', 'Descripción', 'Especificaciones', 'FAQ'];

const ProductModal = ({ isOpen, onClose, product }: ProductModalProps) => {
    const [activeTab, setActiveTab] = useState(tabs[0]);
    // Form state can be added here

    useEffect(() => {
        if (isOpen) {
            setActiveTab(tabs[0]); // Reset tab on open
            // Initialize form with product data if editing
        }
    }, [isOpen, product]);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={product ? 'Editar Producto' : 'Nuevo Producto'}
        >
            <div className="product-modal-container">
                <div className="product-modal-sidebar">
                    {tabs.map(tab => (
                        <button 
                            key={tab}
                            className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab)}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
                <div className="product-modal-content">
                    {activeTab === 'Datos Básicos' && (
                        <div className="tab-pane">
                            <h3>Datos Básicos</h3>
                            <div className="admin-form-grid">
                                <div className="form-group">
                                    <label>Nombre del Producto</label>
                                    <input type="text" placeholder="Ej: Remera Básica" defaultValue={product?.name} />
                                </div>
                                <div className="form-group">
                                    <label>Categoría</label>
                                    <input type="text" placeholder="Ej: Remeras" defaultValue={product?.category} />
                                </div>
                                <div className="form-group">
                                    <label>Precio ($)</label>
                                    <input type="number" placeholder="0.00" defaultValue={product?.price} />
                                </div>
                                <div className="form-group">
                                    <label>Stock General</label>
                                    <input type="number" placeholder="0" defaultValue={product?.stock} />
                                </div>
                                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                    <label>URL de Imagen Principal</label>
                                    <input type="url" placeholder="https://..." defaultValue={product?.imageUrl} />
                                </div>
                            </div>
                        </div>
                    )}
                    {activeTab === 'Variantes' && (
                        <div className="tab-pane">
                            <h3>Variantes</h3>
                            <p>Administrar colores, talles, stock por variante.</p>
                            <button className="admin-btn-secondary mt-2">+ Agregar Variante</button>
                        </div>
                    )}
                    {activeTab === 'Promociones' && (
                        <div className="tab-pane">
                            <h3>Promociones</h3>
                            <div className="form-group">
                                <label>Precio Promocional ($)</label>
                                <input type="number" placeholder="0.00" defaultValue={product?.promoPrice} />
                            </div>
                        </div>
                    )}
                    {activeTab === 'Descripción' && (
                        <div className="tab-pane">
                            <h3>Descripción</h3>
                            <div className="form-group">
                                <textarea rows={6} placeholder="Descripción detallada..."></textarea>
                            </div>
                        </div>
                    )}
                    {activeTab === 'Especificaciones' && (
                        <div className="tab-pane">
                            <h3>Especificaciones</h3>
                            <p>Lista clave / valor editable.</p>
                            <button className="admin-btn-secondary mt-2">+ Agregar Especificación</button>
                        </div>
                    )}
                    {activeTab === 'FAQ' && (
                        <div className="tab-pane">
                            <h3>Preguntas Frecuentes</h3>
                            <p>CRUD de preguntas relativas a este producto.</p>
                            <button className="admin-btn-secondary mt-2">+ Agregar FAQ</button>
                        </div>
                    )}
                </div>
            </div>
            <div className="product-modal-footer">
                <button className="admin-btn-secondary" onClick={onClose}>Cancelar</button>
                <button className="admin-btn-primary">Guardar Producto</button>
            </div>
        </Modal>
    );
};

export default ProductModal;
