import { useState, useEffect } from 'react';
import Modal from '../../../components/common/Modal/Modal';
import { useAdminStore, type AdminProduct } from '../../store/adminStore';
import { supabase } from '../../../config/supabaseClient';
import type { Variant, Specification, FAQ } from '../../../types/product';
import { COLOR_MAP } from '../../../utils/constants';
import { apiFetch } from '../../../utils/apiFetch';
import './ProductModal.css';
import './ProductModalStylesExtension.css';

interface ProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: AdminProduct | null;
}


const tabs = ['Datos Básicos', 'Variantes', 'Promociones', 'Descripción', 'Especificaciones', 'FAQ'];

const ProductModal = ({ isOpen, onClose, product }: ProductModalProps) => {
    const { addProduct, updateProduct, products } = useAdminStore();

    const existingCategories = Array.from(
        new Set(products.map(p => p.category).filter(Boolean))
    ).sort();
    const [activeTab, setActiveTab] = useState(tabs[0]);

    // Datos Básicos
    const [name, setName] = useState('');
    const [category, setCategory] = useState('');
    const [isNewCategory, setIsNewCategory] = useState(false);
    const [price, setPrice] = useState('');
    const [stock, setStock] = useState('');
    const [condition, setCondition] = useState<'new' | 'used'>('new');
    const [images, setImages] = useState<string[]>([]);

    // Promociones
    const [discount, setDiscount] = useState('');
    const [freeShipping, setFreeShipping] = useState(false);

    // Descripción
    const [description, setDescription] = useState('');
    const [featuresText, setFeaturesText] = useState('');
    const [warranty, setWarranty] = useState('');
    const [returnPolicy, setReturnPolicy] = useState('');

    // Variantes
    const [variants, setVariants] = useState<{ name: string; optionsText: string }[]>([]);
    const [customColorName, setCustomColorName] = useState('');
    const [customColorHex, setCustomColorHex] = useState('#000000');
    const [customPaletteColors, setCustomPaletteColors] = useState<Record<string, string>>(() => {
        try { return JSON.parse(localStorage.getItem('db-custom-palette-colors') || '{}'); }
        catch { return {}; }
    });

    const saveCustomPaletteColor = (name: string, hex: string) => {
        const updated = { ...customPaletteColors, [name]: hex };
        setCustomPaletteColors(updated);
        localStorage.setItem('db-custom-palette-colors', JSON.stringify(updated));
    };

    const deleteCustomPaletteColor = (name: string) => {
        const updated = { ...customPaletteColors };
        delete updated[name];
        setCustomPaletteColors(updated);
        localStorage.setItem('db-custom-palette-colors', JSON.stringify(updated));
    };

    // Especificaciones
    const [specifications, setSpecifications] = useState<Specification[]>([]);

    // FAQ
    const [faqs, setFaqs] = useState<FAQ[]>([]);

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setActiveTab(tabs[0]);
            if (product) {
                setName(product.name || '');
                setCategory(product.category || '');
                setIsNewCategory(false);
                setPrice(product.price?.toString() || '');
                setStock(product.stock?.toString() || '');
                setCondition(product.condition || 'new');
                setImages(
                    product.images && product.images.length > 0
                        ? [...product.images]
                        : product.imageUrl ? [product.imageUrl] : []
                );
                setDiscount(product.discount?.toString() || '');
                setFreeShipping(product.freeShipping || false);
                setDescription(product.description || '');
                setFeaturesText((product.features || []).join('\n'));
                setWarranty(product.warranty || '');
                setReturnPolicy(product.returnPolicy || '');
                setVariants(
                    (product.variants || []).map(v => ({
                        name: v.name,
                        optionsText: v.options.join(', '),
                    }))
                );
                setSpecifications(product.specifications ? [...product.specifications] : []);
                setFaqs(product.faqs ? [...product.faqs] : []);
            } else {
                resetForm();
            }
            setError('');
        }
    }, [isOpen, product]);

    const resetForm = () => {
        setName('');
        setCategory('');
        setIsNewCategory(false);
        setPrice('');
        setStock('');
        setCondition('new');
        setImages([]);
        setDiscount('');
        setFreeShipping(false);
        setDescription('');
        setFeaturesText('');
        setWarranty('');
        setReturnPolicy('');
        setVariants([]);
        setSpecifications([]);
        setFaqs([]);
        setCustomColorName('');
        setCustomColorHex('#000000');
    };

    const buildPayload = () => {
        const validImages = images.filter(url => url.trim() !== '');
        return {
            name,
            category: category.trim().replace(/\b\w/g, c => c.toUpperCase()),
            price: parseFloat(price),
            stock: parseInt(stock) || 0,
            imageUrl: validImages[0] || '',
            images: validImages,
            condition,
            description,
            discount: discount ? parseFloat(discount) : undefined,
            freeShipping,
            variants: variants.map(v => ({
                name: v.name,
                options: v.optionsText
                    .split(',')
                    .map(o => {
                        const trimmed = o.trim();
                        return v.name.toLowerCase().startsWith('talle') ? trimmed.toUpperCase() : trimmed;
                    })
                    .filter(Boolean)
                    .filter((val, idx, arr) => arr.indexOf(val) === idx),
            })) as Variant[],
            specifications,
            features: featuresText.split('\n').map(f => f.trim()).filter(Boolean),
            faqs,
            warranty,
            returnPolicy,
            status: 'active' as const,
        };
    };

    const handleSave = async () => {
        if (!name || !price) {
            setError('El nombre y el precio son requeridos');
            return;
        }

        setSaving(true);
        setError('');

        try {
            const session = await supabase.auth.getSession();
            const token = session.data.session?.access_token;
            if (!token) throw new Error('Token no disponible');

            const payload = buildPayload();

            if (product?.id) {
                // Editar: llamar API y actualizar store
                const response = await apiFetch(
                    `${import.meta.env.VITE_API_URL_LOCAL}/products/${product.id}`,
                    {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`,
                        },
                        body: JSON.stringify(payload),
                    }
                );
                if (!response.ok) {
                    const err = await response.json();
                    throw new Error(err.message || 'No se pudo actualizar el producto');
                }
                updateProduct(product.id, payload);
            } else {
                // Crear: llamar API y agregar al store
                const response = await apiFetch(`${import.meta.env.VITE_API_URL_LOCAL}/products`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify(payload),
                });
                if (!response.ok) {
                    const err = await response.json();
                    throw new Error(err.message || 'No se pudo crear el producto');
                }
                const savedData = await response.json();
                const newProduct: AdminProduct = {
                    id: savedData.data?.id || Date.now().toString(),
                    ...payload,
                };
                addProduct(newProduct);
            }

            resetForm();
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'No se pudo guardar el producto');
        } finally {
            setSaving(false);
        }
    };

    const addImage = () => setImages(prev => [...prev, '']);
    const removeImage = (i: number) => setImages(prev => prev.filter((_, j) => j !== i));
    const updateImage = (i: number, value: string) => {
        setImages(prev => {
            const updated = [...prev];
            updated[i] = value;
            return updated;
        });
    };
    const moveImageUp = (i: number) => {
        if (i === 0) return;
        setImages(prev => {
            const updated = [...prev];
            [updated[i - 1], updated[i]] = [updated[i], updated[i - 1]];
            return updated;
        });
    };
    const moveImageDown = (i: number) => {
        setImages(prev => {
            if (i === prev.length - 1) return prev;
            const updated = [...prev];
            [updated[i], updated[i + 1]] = [updated[i + 1], updated[i]];
            return updated;
        });
    };

    const addVariant = () => setVariants([...variants, { name: '', optionsText: '' }]);
    const removeVariant = (i: number) => setVariants(variants.filter((_, j) => j !== i));
    const updateVariant = (i: number, field: 'name' | 'optionsText', value: string) => {
        const updated = [...variants];
        updated[i] = { ...updated[i], [field]: value };
        setVariants(updated);
    };

    const addSpec = () => setSpecifications([...specifications, { label: '', value: '' }]);
    const removeSpec = (i: number) => setSpecifications(specifications.filter((_, j) => j !== i));
    const updateSpec = (i: number, field: 'label' | 'value', value: string) => {
        const updated = [...specifications];
        updated[i] = { ...updated[i], [field]: value };
        setSpecifications(updated);
    };

    const addFaq = () => setFaqs([...faqs, { question: '', answer: '' }]);
    const removeFaq = (i: number) => setFaqs(faqs.filter((_, j) => j !== i));
    const updateFaq = (i: number, field: 'question' | 'answer', value: string) => {
        const updated = [...faqs];
        updated[i] = { ...updated[i], [field]: value };
        setFaqs(updated);
    };

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
                    {error && (
                        <div style={{ color: 'red', marginBottom: '1rem', padding: '0.5rem', background: '#fff0f0', borderRadius: '0.25rem' }}>
                            {error}
                        </div>
                    )}

                    {/* ── DATOS BÁSICOS ── */}
                    {activeTab === 'Datos Básicos' && (
                        <div className="tab-pane">
                            <h3>Datos Básicos</h3>
                            <div className="admin-form-grid">
                                <div className="form-group">
                                    <label>Nombre del producto</label>
                                    <input
                                        type="text"
                                        placeholder="Ej: Remera Básica"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Categoría</label>
                                    {!isNewCategory ? (
                                        <select
                                            className="category-select"
                                            value={category}
                                            onChange={e => {
                                                if (e.target.value === '__new__') {
                                                    setCategory('');
                                                    setIsNewCategory(true);
                                                } else {
                                                    setCategory(e.target.value);
                                                }
                                            }}
                                        >
                                            <option value="">-- Seleccionar categoría --</option>
                                            {existingCategories.map(cat => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                            <option value="__new__">+ Agregar nueva categoría...</option>
                                        </select>
                                    ) : (
                                        <div className="category-new-input-wrapper">
                                            <input
                                                type="text"
                                                className="category-new-input"
                                                placeholder="Nombre de la nueva categoría"
                                                value={category}
                                                onChange={e => setCategory(e.target.value)}
                                                autoFocus
                                            />
                                            <button
                                                type="button"
                                                className="category-cancel-btn"
                                                onClick={() => { setIsNewCategory(false); setCategory(''); }}
                                            >
                                                Cancelar
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <div className="form-group">
                                    <label>Precio ($)</label>
                                    <input
                                        type="number"
                                        placeholder="0.00"
                                        value={price}
                                        onChange={e => setPrice(e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Stock disponible</label>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        value={stock}
                                        onChange={e => setStock(e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Condición</label>
                                    <select
                                        value={condition}
                                        onChange={e => setCondition(e.target.value as 'new' | 'used')}
                                    >
                                        <option value="new">Nuevo</option>
                                        <option value="used">Usado</option>
                                    </select>
                                </div>
                                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                    <label>Imágenes del producto</label>
                                    <p style={{ fontSize: '0.82rem', color: '#666', margin: '0 0 0.75rem' }}>
                                        La primera imagen será la principal. Podés agregar, reordenar o eliminar imágenes usando URLs.
                                    </p>
                                    <div className="img-manager">
                                        {images.length === 0 && (
                                            <p className="img-manager__empty">Sin imágenes. Agregá al menos una URL.</p>
                                        )}
                                        {images.map((url, i) => (
                                            <div key={i} className="img-manager__row">
                                                <div className="img-manager__order">
                                                    <button
                                                        type="button"
                                                        className="img-manager__move-btn"
                                                        onClick={() => moveImageUp(i)}
                                                        disabled={i === 0}
                                                        title="Subir"
                                                    >▲</button>
                                                    <span className="img-manager__idx">
                                                        {i === 0
                                                            ? <span className="img-manager__badge">Principal</span>
                                                            : i + 1
                                                        }
                                                    </span>
                                                    <button
                                                        type="button"
                                                        className="img-manager__move-btn"
                                                        onClick={() => moveImageDown(i)}
                                                        disabled={i === images.length - 1}
                                                        title="Bajar"
                                                    >▼</button>
                                                </div>
                                                <div className="img-manager__preview">
                                                    {url.trim() ? (
                                                        <img
                                                            src={url}
                                                            alt={`Imagen ${i + 1}`}
                                                            className="img-manager__thumb"
                                                            onError={e => {
                                                                (e.target as HTMLImageElement).style.opacity = '0';
                                                            }}
                                                        />
                                                    ) : (
                                                        <div className="img-manager__thumb img-manager__thumb--empty" />
                                                    )}
                                                </div>
                                                <input
                                                    type="url"
                                                    className="img-manager__input"
                                                    placeholder="https://ejemplo.com/imagen.jpg"
                                                    value={url}
                                                    onChange={e => updateImage(i, e.target.value)}
                                                />
                                                <button
                                                    type="button"
                                                    className="img-manager__delete-btn"
                                                    onClick={() => removeImage(i)}
                                                    title="Eliminar imagen"
                                                >✕</button>
                                            </div>
                                        ))}
                                    </div>
                                    <button
                                        type="button"
                                        className="admin-btn-secondary mt-2"
                                        onClick={addImage}
                                    >
                                        + Agregar imagen
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── VARIANTES ── */}
                    {activeTab === 'Variantes' && (
                        <div className="tab-pane">
                            <h3>Variantes</h3>
                            <p style={{ color: '#666', fontSize: '0.88rem', marginBottom: '1rem' }}>
                                Ej: nombre "Color" con opciones desde la paleta — nombre "Talle" con opciones "S, M, L, XL"
                            </p>
                            {variants.map((v, i) => {
                                const isColorVariant = v.name.toLowerCase() === 'color';
                                const selectedColors = v.optionsText
                                    .split(',').map(s => s.trim()).filter(Boolean);
                                return (
                                    <div
                                        key={i}
                                        style={{
                                            border: '1px solid #e0e0e0',
                                            borderRadius: '0.5rem',
                                            padding: '1rem',
                                            marginBottom: '0.75rem',
                                        }}
                                    >
                                        <div className="admin-form-grid">
                                            <div className="form-group">
                                                <label>Nombre de variante</label>
                                                <input
                                                    type="text"
                                                    placeholder="Ej: Color"
                                                    value={v.name}
                                                    onChange={e => updateVariant(i, 'name', e.target.value)}
                                                />
                                            </div>
                                            {isColorVariant ? (
                                                <div className="form-group">
                                                    <label>Colores disponibles</label>
                                                    <div className="color-palette-picker">
                                                        {Object.entries(COLOR_MAP).map(([colorName, hex]) => {
                                                            const isSelected = selectedColors.includes(colorName);
                                                            return (
                                                                <button
                                                                    key={colorName}
                                                                    type="button"
                                                                    title={colorName}
                                                                    className={`color-palette__swatch${isSelected ? ' color-palette__swatch--selected' : ''}`}
                                                                    style={{ backgroundColor: hex }}
                                                                    onClick={() => {
                                                                        const current = new Set(selectedColors);
                                                                        if (current.has(colorName)) {
                                                                            current.delete(colorName);
                                                                        } else {
                                                                            current.add(colorName);
                                                                        }
                                                                        updateVariant(i, 'optionsText', [...current].join(', '));
                                                                    }}
                                                                />
                                                            );
                                                        })}
                                                        {Object.entries(customPaletteColors).map(([colorName, hex]) => {
                                                            const entry = `${colorName}|${hex}`;
                                                            const isSelected = selectedColors.includes(entry);
                                                            return (
                                                                <div key={colorName} className="color-palette__swatch-wrapper">
                                                                    <button
                                                                        type="button"
                                                                        title={colorName}
                                                                        className={`color-palette__swatch color-palette__swatch--saved-custom${isSelected ? ' color-palette__swatch--selected' : ''}`}
                                                                        style={{ backgroundColor: hex }}
                                                                        onClick={() => {
                                                                            const current = new Set(selectedColors);
                                                                            if (current.has(entry)) {
                                                                                current.delete(entry);
                                                                            } else {
                                                                                current.add(entry);
                                                                            }
                                                                            updateVariant(i, 'optionsText', [...current].join(', '));
                                                                        }}
                                                                    />
                                                                    <button
                                                                        type="button"
                                                                        className="color-palette__swatch-delete"
                                                                        title={`Eliminar ${colorName} de la paleta`}
                                                                        onClick={() => {
                                                                            deleteCustomPaletteColor(colorName);
                                                                            const newSelected = selectedColors.filter(c => c !== entry);
                                                                            if (newSelected.length !== selectedColors.length) {
                                                                                updateVariant(i, 'optionsText', newSelected.join(', '));
                                                                            }
                                                                        }}
                                                                    >✕</button>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                    {/* Colores custom ya agregados */}
                                                    {selectedColors.filter(c => c.includes('|#')).length > 0 && (
                                                        <div className="color-custom-tags">
                                                            {selectedColors.filter(c => c.includes('|#')).map(c => {
                                                                const pipeIdx = c.indexOf('|#');
                                                                const cName = c.slice(0, pipeIdx);
                                                                const cHex = c.slice(pipeIdx + 1);
                                                                return (
                                                                    <span key={c} className="color-custom-tag">
                                                                        <span className="color-custom-tag__dot" style={{ backgroundColor: cHex }} />
                                                                        {cName}
                                                                        <button
                                                                            type="button"
                                                                            className="color-custom-tag__remove"
                                                                            onClick={() => {
                                                                                const current = selectedColors.filter(s => s !== c);
                                                                                updateVariant(i, 'optionsText', current.join(', '));
                                                                            }}
                                                                        >✕</button>
                                                                    </span>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                    {selectedColors.length > 0 && (
                                                        <p className="color-palette__selected-label">
                                                            Seleccionados: {selectedColors.map(c => c.includes('|#') ? c.slice(0, c.indexOf('|#')) : c).join(', ')}
                                                        </p>
                                                    )}
                                                    {/* Agregar color personalizado */}
                                                    {(() => {
                                                        const trimmed = customColorName.trim().toLowerCase();
                                                        const existingNames = selectedColors.map(c =>
                                                            c.includes('|#') ? c.slice(0, c.indexOf('|#')).toLowerCase() : c.toLowerCase()
                                                        );
                                                        const isInSelected = trimmed.length > 0 && existingNames.includes(trimmed);
                                                        const isInColorMap = trimmed.length > 0 && Object.keys(COLOR_MAP).some(k => k.toLowerCase() === trimmed);
                                                        const isInCustomPalette = trimmed.length > 0 && Object.keys(customPaletteColors).some(k => k.toLowerCase() === trimmed);
                                                        const isDuplicate = isInSelected || isInColorMap || isInCustomPalette;
                                                        const duplicateMsg = isInSelected
                                                            ? 'Ya existe ese color en la lista'
                                                            : isInColorMap
                                                            ? 'Ya existe ese color en la paleta'
                                                            : 'Ya existe ese color en los colores guardados';
                                                        return (
                                                            <>
                                                                <div className="color-custom-add">
                                                                    <span className="color-custom-add__label">Color personalizado:</span>
                                                                    <input
                                                                        type="text"
                                                                        className={`color-custom-add__name${isDuplicate ? ' color-custom-add__name--error' : ''}`}
                                                                        placeholder="Nombre (ej: Turquesa)"
                                                                        value={customColorName}
                                                                        onChange={e => setCustomColorName(e.target.value)}
                                                                    />
                                                                    <input
                                                                        type="color"
                                                                        className="color-custom-add__picker"
                                                                        value={customColorHex}
                                                                        onChange={e => setCustomColorHex(e.target.value)}
                                                                    />
                                                                    <button
                                                                        type="button"
                                                                        className="color-custom-add__btn"
                                                                        disabled={!customColorName.trim() || isDuplicate}
                                                                        onClick={() => {
                                                                            const t = customColorName.trim();
                                                                            if (!t) return;
                                                                            const newEntry = `${t}|${customColorHex}`;
                                                                            const current = selectedColors.filter(Boolean);
                                                                            updateVariant(i, 'optionsText', [...current, newEntry].join(', '));
                                                                            // Guardar en paleta si no existe en COLOR_MAP ni en paleta custom
                                                                            const inMap = Object.keys(COLOR_MAP).some(k => k.toLowerCase() === t.toLowerCase());
                                                                            const inCustom = Object.keys(customPaletteColors).some(k => k.toLowerCase() === t.toLowerCase());
                                                                            if (!inMap && !inCustom) {
                                                                                saveCustomPaletteColor(t, customColorHex);
                                                                            }
                                                                            setCustomColorName('');
                                                                            setCustomColorHex('#000000');
                                                                        }}
                                                                    >
                                                                        + Agregar
                                                                    </button>
                                                                </div>
                                                                {isDuplicate && (
                                                                    <p className="color-custom-add__duplicate">
                                                                        {duplicateMsg}
                                                                    </p>
                                                                )}
                                                            </>
                                                        );
                                                    })()}
                                                </div>
                                            ) : (
                                                <div className="form-group">
                                                    <label>Opciones (separadas por coma)</label>
                                                    <input
                                                        type="text"
                                                        placeholder="S, M, L, XL"
                                                        value={v.optionsText}
                                                        onChange={e => updateVariant(i, 'optionsText', e.target.value)}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            className="admin-btn-secondary"
                                            style={{ marginTop: '0.25rem' }}
                                            onClick={() => removeVariant(i)}
                                        >
                                            Eliminar variante
                                        </button>
                                    </div>
                                );
                            })}
                            <button className="admin-btn-secondary mt-2" onClick={addVariant}>
                                + Agregar variante
                            </button>
                        </div>
                    )}

                    {/* ── PROMOCIONES ── */}
                    {activeTab === 'Promociones' && (
                        <div className="tab-pane">
                            <h3>Promociones</h3>
                            <div className="admin-form-grid">
                                <div className="form-group">
                                    <label>Descuento (%)</label>
                                    <input
                                        type="number"
                                        placeholder="Ej: 20"
                                        value={discount}
                                        min="0"
                                        max="100"
                                        onChange={e => setDiscount(e.target.value)}
                                    />
                                    {discount && (
                                        <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.25rem' }}>
                                            Se mostrará como "{discount}% OFF" en la vista del producto
                                        </p>
                                    )}
                                </div>
                                <div className="form-group">
                                    <label>Envío gratis</label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', marginTop: '0.5rem' }}>
                                        <input
                                            type="checkbox"
                                            checked={freeShipping}
                                            onChange={e => setFreeShipping(e.target.checked)}
                                        />
                                        Activar envío gratis
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── DESCRIPCIÓN ── */}
                    {activeTab === 'Descripción' && (
                        <div className="tab-pane">
                            <h3>Descripción</h3>
                            <div className="form-group">
                                <label>Descripción del producto</label>
                                <textarea
                                    rows={5}
                                    placeholder="Descripción detallada del producto..."
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                />
                            </div>
                            <div className="form-group">
                                <label>Características principales (una por línea)</label>
                                <textarea
                                    rows={4}
                                    placeholder={"Tela de algodón 100%\nLavado a mano\nDisponible en varios colores"}
                                    value={featuresText}
                                    onChange={e => setFeaturesText(e.target.value)}
                                />
                            </div>
                            <div className="admin-form-grid">
                                <div className="form-group">
                                    <label>Garantía</label>
                                    <input
                                        type="text"
                                        placeholder="Ej: 6 meses"
                                        value={warranty}
                                        onChange={e => setWarranty(e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Política de devolución</label>
                                    <input
                                        type="text"
                                        placeholder="Ej: 30 días para devoluciones"
                                        value={returnPolicy}
                                        onChange={e => setReturnPolicy(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── ESPECIFICACIONES ── */}
                    {activeTab === 'Especificaciones' && (
                        <div className="tab-pane">
                            <h3>Especificaciones técnicas</h3>
                            <p style={{ color: '#666', fontSize: '0.88rem', marginBottom: '1rem' }}>
                                Ej: "Material" → "100% Algodón", "Talle" → "S / M / L / XL"
                            </p>
                            {specifications.map((spec, i) => (
                                <div
                                    key={i}
                                    style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}
                                >
                                    <input
                                        type="text"
                                        placeholder="Característica"
                                        value={spec.label}
                                        onChange={e => updateSpec(i, 'label', e.target.value)}
                                        style={{ flex: 1 }}
                                    />
                                    <input
                                        type="text"
                                        placeholder="Valor"
                                        value={spec.value}
                                        onChange={e => updateSpec(i, 'value', e.target.value)}
                                        style={{ flex: 1 }}
                                    />
                                    <button
                                        className="admin-btn-secondary"
                                        style={{ flexShrink: 0 }}
                                        onClick={() => removeSpec(i)}
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                            <button className="admin-btn-secondary mt-2" onClick={addSpec}>
                                + Agregar especificación
                            </button>
                        </div>
                    )}

                    {/* ── FAQ ── */}
                    {activeTab === 'FAQ' && (
                        <div className="tab-pane">
                            <h3>Preguntas frecuentes</h3>
                            {faqs.map((faq, i) => (
                                <div
                                    key={i}
                                    style={{
                                        border: '1px solid #e0e0e0',
                                        borderRadius: '0.5rem',
                                        padding: '1rem',
                                        marginBottom: '0.75rem',
                                    }}
                                >
                                    <div className="form-group">
                                        <label>Pregunta</label>
                                        <input
                                            type="text"
                                            placeholder="¿Cuál es el tiempo de entrega?"
                                            value={faq.question}
                                            onChange={e => updateFaq(i, 'question', e.target.value)}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Respuesta</label>
                                        <textarea
                                            rows={3}
                                            placeholder="La entrega demora entre 3 y 5 días hábiles..."
                                            value={faq.answer}
                                            onChange={e => updateFaq(i, 'answer', e.target.value)}
                                        />
                                    </div>
                                    <button
                                        className="admin-btn-secondary"
                                        onClick={() => removeFaq(i)}
                                    >
                                        Eliminar pregunta
                                    </button>
                                </div>
                            ))}
                            <button className="admin-btn-secondary mt-2" onClick={addFaq}>
                                + Agregar pregunta
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="product-modal-footer">
                <button className="admin-btn-secondary" onClick={onClose} disabled={saving}>
                    Cancelar
                </button>
                <button
                    className="admin-btn-primary"
                    onClick={handleSave}
                    disabled={saving}
                >
                    {saving ? 'Guardando...' : 'Guardar producto'}
                </button>
            </div>
        </Modal>
    );
};

export default ProductModal;
