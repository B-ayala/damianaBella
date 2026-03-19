import { useState, useEffect } from 'react';
import { Reorder } from 'framer-motion';
import { Trash2, GripVertical, EyeOff, Eye } from 'lucide-react';
import { useAdminStore, type CarouselImage } from '../../store/adminStore';
import {
    fetchAllCarouselImages,
    insertCarouselImage,
    updateCarouselImageDb,
    deleteCarouselImageDb,
    reorderCarouselImages,
} from '../../../services/productService';
import './CarouselManager.css';

const CarouselManager = () => {
    const { carouselImages, setCarouselImages, updateCarouselImage, deleteCarouselImage } = useAdminStore();
    const [newImageUrl, setNewImageUrl] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchAllCarouselImages()
            .then(setCarouselImages)
            .catch(() => setError('No se pudieron cargar las imágenes del carrusel.'))
            .finally(() => setLoading(false));
    }, [setCarouselImages]);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        const url = newImageUrl.trim();
        if (!url) return;
        setSaving(true);
        setError('');
        try {
            const nextOrder = carouselImages.length + 1;
            const newImg = await insertCarouselImage(url, nextOrder);
            setCarouselImages([...carouselImages, newImg]);
            setNewImageUrl('');
        } catch {
            setError('No se pudo agregar la imagen.');
        } finally {
            setSaving(false);
        }
    };

    const handleReorder = async (newOrder: CarouselImage[]) => {
        const updated = newOrder.map((img, index) => ({ ...img, order: index + 1 }));
        setCarouselImages(updated);
        try {
            await reorderCarouselImages(updated.map(img => ({ id: img.id, order: img.order })));
        } catch {
            setError('No se pudo guardar el nuevo orden.');
        }
    };

    const handleToggle = async (img: CarouselImage) => {
        const newActive = !img.isActive;
        updateCarouselImage(img.id, { isActive: newActive });
        try {
            await updateCarouselImageDb(img.id, { is_active: newActive });
        } catch {
            updateCarouselImage(img.id, { isActive: img.isActive });
            setError('No se pudo actualizar la imagen.');
        }
    };

    const handleDelete = async (id: string) => {
        deleteCarouselImage(id);
        try {
            await deleteCarouselImageDb(id);
        } catch {
            setError('No se pudo eliminar la imagen.');
        }
    };

    return (
        <div className="admin-card carousel-manager">
            <h2 className="admin-card-title">Gestión de Carrusel</h2>
            <p className="admin-card-desc">
                Cada slide muestra exactamente 3 imágenes. Las imágenes se agrupan automáticamente de 3 en 3 según el orden establecido.
            </p>

            {error && (
                <p style={{ color: 'var(--error, #ef4444)', marginBottom: '12px', fontSize: '14px' }}>{error}</p>
            )}

            <form onSubmit={handleAdd} className="add-carousel-form">
                <input
                    type="url"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    placeholder="URL de la nueva imagen..."
                    required
                    disabled={saving}
                />
                <button type="submit" className="admin-btn-primary" disabled={saving}>
                    {saving ? 'Guardando...' : 'Añadir Imagen'}
                </button>
            </form>

            {loading ? (
                <div className="empty-state">Cargando imágenes...</div>
            ) : (
                <>
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
                                            onClick={() => handleToggle(img)}
                                        >
                                            {img.isActive ? <><Eye size={16} /> Activa</> : <><EyeOff size={16} /> Inactiva</>}
                                        </button>
                                    </div>
                                    <div className="carousel-item-actions">
                                        <button
                                            type="button"
                                            className="action-btn delete"
                                            onClick={() => handleDelete(img.id)}
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
                </>
            )}
        </div>
    );
};

export default CarouselManager;
