import { useState } from 'react';
import { Reorder } from 'framer-motion';
import { Trash2, GripVertical, EyeOff, Eye } from 'lucide-react';
import { useAdminStore, type CarouselImage } from '../../store/adminStore';
import './CarouselManager.css';

const CarouselManager = () => {
    const { carouselImages, setCarouselImages, addCarouselImage, updateCarouselImage, deleteCarouselImage } = useAdminStore();
    const [newImageUrl, setNewImageUrl] = useState('');

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (newImageUrl.trim()) {
            addCarouselImage(newImageUrl);
            setNewImageUrl('');
        }
    };

    const handleReorder = (newOrder: CarouselImage[]) => {
        const updated = newOrder.map((img, index) => ({ ...img, order: index + 1 }));
        setCarouselImages(updated);
    };

    return (
        <div className="admin-card carousel-manager">
            <h2 className="admin-card-title">Gestión de Carrusel</h2>
            <p className="admin-card-desc">
                Cada slide muestra exactamente 3 imágenes. Las imágenes se agrupan automáticamente de 3 en 3 según el orden establecido.
            </p>
            
            <form onSubmit={handleAdd} className="add-carousel-form">
                <input 
                    type="url" 
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    placeholder="URL de la nueva imagen..."
                    required
                />
                <button type="submit" className="admin-btn-primary">Añadir Imagen</button>
            </form>

            {/* Resumen de slides */}
            {carouselImages.length > 0 && (
                <div className="slides-summary">
                    <span className="slides-count">
                        {Math.ceil(carouselImages.filter(img => img.isActive).length / 3)} slides activos 
                        ({carouselImages.filter(img => img.isActive).length} imágenes activas)
                    </span>
                </div>
            )}

            <Reorder.Group 
                axis="y" 
                values={carouselImages} 
                onReorder={handleReorder}
                className="carousel-list"
            >
                {carouselImages.map((img, index) => {
                    const slideNumber = Math.floor(index / 3) + 1;
                    const positionInSlide = (index % 3) + 1;
                    const isFirstInSlide = index % 3 === 0;
                    
                    return (
                        <Reorder.Item 
                            key={img.id} 
                            value={img} 
                            className={`carousel-item ${isFirstInSlide ? 'slide-start' : ''}`}
                        >
                            {isFirstInSlide && (
                                <div className="slide-indicator">Slide {slideNumber}</div>
                            )}
                            <div className="drag-handle">
                                <GripVertical size={20} />
                            </div>
                            <div className="carousel-img-preview">
                                <img src={img.url} alt={`Slide ${slideNumber} - Img ${positionInSlide}`} />
                            </div>
                            <div className="carousel-item-info">
                                <span className="carousel-order">#{img.order} (Posición {positionInSlide}/3)</span>
                                <button 
                                    type="button"
                                    className={`status-toggle ${img.isActive ? 'active' : 'inactive'}`}
                                    onClick={() => updateCarouselImage(img.id, { isActive: !img.isActive })}
                                >
                                    {img.isActive ? <><Eye size={16}/> Activa</> : <><EyeOff size={16}/> Inactiva</>}
                                </button>
                            </div>
                            <div className="carousel-item-actions">
                                <button 
                                    type="button"
                                    className="action-btn delete"
                                    onClick={() => deleteCarouselImage(img.id)}
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </Reorder.Item>
                    );
                })}
            </Reorder.Group>
            
            {carouselImages.length === 0 && (
                <div className="empty-state">No hay imágenes en el carrusel.</div>
            )}
        </div>
    );
};

export default CarouselManager;
