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
        const updated = newOrder.map((img: CarouselImage, index: number) => ({ ...img, order: index + 1 }));
        setCarouselImages(updated);
    };

    return (
        <div className="admin-card carousel-manager">
            <h2 className="admin-card-title">Gestión de Carrusel</h2>
            
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

            <Reorder.Group 
                axis="y" 
                values={carouselImages} 
                onReorder={handleReorder}
                className="carousel-list"
            >
                {carouselImages.map((img: CarouselImage) => (
                    <Reorder.Item 
                        key={img.id} 
                        value={img} 
                        className="carousel-item"
                    >
                        <div className="drag-handle">
                            <GripVertical size={20} />
                        </div>
                        <div className="carousel-img-preview">
                            <img src={img.url} alt={`Slide ${img.order}`} />
                        </div>
                        <div className="carousel-item-info">
                            <span className="carousel-order">Orden: {img.order}</span>
                            <button 
                                type="button"
                                className={`status-toggle ${img.isActive ? 'active' : 'inactive'}`}
                                onClick={() => updateCarouselImage(img.id, { isActive: !img.isActive })}
                            >
                                {img.isActive ? <><Eye size={16}/> Activo</> : <><EyeOff size={16}/> Inactivo</>}
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
                ))}
            </Reorder.Group>
            
            {carouselImages.length === 0 && (
                <div className="empty-state">No hay imágenes en el carrusel.</div>
            )}
        </div>
    );
};

export default CarouselManager;
