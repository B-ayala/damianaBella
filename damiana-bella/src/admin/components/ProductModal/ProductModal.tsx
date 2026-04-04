import React, { useState, useEffect, useMemo } from 'react';
import Modal from '../../../components/common/Modal/Modal';
import ConfirmationModal from '../../../components/common/Modal/ConfirmationModal';
import { useAdminStore, type AdminProduct } from '../../store/adminStore';
import { supabase } from '../../../config/supabaseClient';
import type { Variant, Specification, FAQ } from '../../../types/product';
import { COLOR_MAP } from '../../../utils/constants';
import { calculateDiscountPercentage } from '../../../utils/pricing';
import { apiFetch } from '../../../utils/apiFetch';
import { fetchCategoriesTree, createCategory, deleteCategory, type Category } from '../../../services/productService';
import { Folder, FolderOpen, Dot, Plus, X, Images } from 'lucide-react';
import CloudinaryImagePicker from '../CloudinaryImagePicker/CloudinaryImagePicker';
import './ProductModal.css';
import './ProductModalStylesExtension.css';

interface ProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: AdminProduct | null;
    onSaved?: () => void;
}


const tabs = ['Datos Básicos', 'Variantes', 'Promociones', 'Descripción', 'Especificaciones', 'FAQ'];

const ProductModal = ({ isOpen, onClose, product, onSaved }: ProductModalProps) => {
    const { addProduct, updateProduct } = useAdminStore();

    const [activeTab, setActiveTab] = useState(tabs[0]);
    const [dbCategories, setDbCategories] = useState<Category[]>([]);

    // Datos Básicos
    const [name, setName] = useState('');
    const [category, setCategory] = useState('');
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [newCatName, setNewCatName] = useState('');
    const [savingCategory, setSavingCategory] = useState(false);
    const [categoryError, setCategoryError] = useState('');
    const [newCatParentId, setNewCatParentId] = useState<string | null>(null);
    const [showManageCatModal, setShowManageCatModal] = useState(false);
    const [deletingCatId, setDeletingCatId] = useState<string | null>(null);
    const [manageCatError, setManageCatError] = useState('');
    const [deleteCatConfirm, setDeleteCatConfirm] = useState<{ id: string; name: string } | null>(null);
    const [catDropOpen, setCatDropOpen] = useState(false);
    const [expandedCatIds, setExpandedCatIds] = useState<Set<string>>(new Set());
    const [price, setPrice] = useState('');
    const [stock, setStock] = useState('');
    const [condition, setCondition] = useState<'new' | 'used'>('new');
    const [status, setStatus] = useState<'active' | 'inactive'>('active');
    const [images, setImages] = useState<string[]>([]);
    const [pickerOpen, setPickerOpen] = useState(false);

    // Promociones
    const [originalPrice, setOriginalPrice] = useState('');
    const [discount, setDiscount] = useState('');
    const [discountTouched, setDiscountTouched] = useState(false);
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
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [showOptionalWarning, setShowOptionalWarning] = useState(false);
    const [missingOptionals, setMissingOptionals] = useState<string[]>([]);

    // Clear category error as soon as a category is selected
    React.useEffect(() => {
        if (category && fieldErrors.category) {
            setFieldErrors(prev => { const n = {...prev}; delete n.category; return n; });
        }
    }, [category]);

    const toggleCatExpand = (id: string) => {
        setExpandedCatIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    // Pre-compute tree once per dbCategories change — avoids O(n³) filters on every render
    const categoryTree = useMemo(() => (
        dbCategories
            .filter(c => c.level === 1)
            .map(cat => ({
                ...cat,
                children: dbCategories
                    .filter(c => c.parent_id === cat.id)
                    .map(sub => ({
                        ...sub,
                        children: dbCategories.filter(c => c.parent_id === sub.id),
                    })),
            }))
    ), [dbCategories]);

    const promotionReferencePrice = useMemo(() => {
        if (product?.originalPrice && product.originalPrice > 0) return product.originalPrice;
        if (product?.price && product.price > 0) return product.price;
        return undefined;
    }, [product]);

    const syncPromotionFromPrice = (nextPriceValue: string, ignoreDiscountTouched = false) => {
        if (!product || (discountTouched && !ignoreDiscountTouched)) return;

        const nextPrice = parseFloat(nextPriceValue);
        if (!promotionReferencePrice || !Number.isFinite(nextPrice) || nextPrice <= 0) return;

        if (nextPrice < promotionReferencePrice) {
            const nextDiscount = calculateDiscountPercentage(promotionReferencePrice, nextPrice);
            setOriginalPrice(promotionReferencePrice.toString());
            setDiscount(nextDiscount ? nextDiscount.toString() : '');
            return;
        }

        if (product.originalPrice && nextPrice >= product.originalPrice) {
            setOriginalPrice('');
            setDiscount('');
            return;
        }

        setOriginalPrice(product.originalPrice?.toString() || '');
        setDiscount(product.discount?.toString() || '');
    };

    useEffect(() => {
        if (isOpen) {
            const savedCategory = product?.category || '';
            fetchCategoriesTree().then(cats => {
                setDbCategories(cats);
                // Normaliza: busca la categoría de forma case-insensitive y usa el
                // nombre exacto de la DB para que coincida con el option del árbol.
                const matched = cats.find(c => c.name.toLowerCase() === savedCategory.toLowerCase());
                setCategory(matched ? matched.name : savedCategory);
            });
            setActiveTab(tabs[0]);
            if (product) {
                setName(product.name || '');
                setCategory(savedCategory);
                setPrice(product.price?.toString() || '');
                setStock(product.stock?.toString() || '');
                setCondition(product.condition || 'new');
                setStatus(product.status || 'active');
                setImages(
                    product.images && product.images.length > 0
                        ? [...product.images]
                        : product.imageUrl ? [product.imageUrl] : []
                );
                setOriginalPrice(product.originalPrice?.toString() || '');
                setDiscount(product.discount?.toString() || '');
                setDiscountTouched(false);
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
        setPrice('');
        setStock('');
        setCondition('new');
        setStatus('active');
        setImages([]);
        setOriginalPrice('');
        setDiscount('');
        setDiscountTouched(false);
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
        setFieldErrors({});
        setShowOptionalWarning(false);
        setMissingOptionals([]);
    };

    const buildPayload = () => {
        const validImages = images.filter(url => url.trim() !== '');
        return {
            name,
            category: category.trim().replace(/\b\w/g, c => c.toUpperCase()),
            price: parseFloat(price),
            originalPrice: originalPrice ? parseFloat(originalPrice) : undefined,
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
            status,
        };
    };

    const executeSave = async () => {
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
            onSaved?.();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'No se pudo guardar el producto');
        } finally {
            setSaving(false);
        }
    };

    const handleSave = async () => {
        // Nivel 1: campos obligatorios
        const errors: Record<string, string> = {};
        if (!name.trim()) errors.name = 'El nombre es requerido';
        if (!price) errors.price = 'El precio es requerido';
        if (!category) errors.category = 'La categoría es requerida';
        if (!stock) errors.stock = 'El stock es requerido';

        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            setActiveTab('Datos Básicos');
            return;
        }

        setFieldErrors({});

        // Nivel 2: campos opcionales recomendados
        const hasValidVariants = variants.some(v => v.name.trim() && v.optionsText.trim());
        const missing: string[] = [];
        if (!hasValidVariants) missing.push('Variantes (colores, talles)');
        if (!description.trim()) missing.push('Descripción');
        if (specifications.length === 0) missing.push('Especificaciones técnicas');
        if (faqs.length === 0) missing.push('Preguntas frecuentes (FAQ)');

        if (missing.length > 0) {
            setMissingOptionals(missing);
            setShowOptionalWarning(true);
            return;
        }

        await executeSave();
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

    const handlePickerSelect = (selectedUrls: string[]) => {
        const newUrls = selectedUrls.filter(url => !images.includes(url));
        setImages(prev => [...prev, ...newUrls]);
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

    const handleCreateCategory = async () => {
        if (!newCatName.trim()) return;
        setSavingCategory(true);
        setCategoryError('');
        try {
            const parentCat = newCatParentId ? dbCategories.find(c => c.id === newCatParentId) : null;
            const level = parentCat ? parentCat.level + 1 : 1;
            const created = await createCategory(newCatName.trim(), newCatParentId, level);
            const updated = await fetchCategoriesTree();
            setDbCategories(updated);
            setCategory(created.name);
            setShowCategoryModal(false);
            setNewCatName('');
            setNewCatParentId(null);
        } catch (err) {
            setCategoryError(err instanceof Error ? err.message : 'No se pudo crear la categoría');
        } finally {
            setSavingCategory(false);
        }
    };

    const handleDeleteCategory = async (id: string, name: string) => {
        setDeleteCatConfirm({ id, name });
    };

    const confirmDeleteCategory = async () => {
        if (!deleteCatConfirm) return;
        const { id, name } = deleteCatConfirm;
        setDeletingCatId(id);
        setManageCatError('');
        try {
            await deleteCategory(id);
            const updated = await fetchCategoriesTree();
            setDbCategories(updated);
            if (category === name) setCategory('');
        } catch (err) {
            setManageCatError(err instanceof Error ? err.message : 'No se pudo eliminar la categoría');
        } finally {
            setDeletingCatId(null);
        }
    };

    const addFaq = () => setFaqs([...faqs, { question: '', answer: '' }]);
    const removeFaq = (i: number) => setFaqs(faqs.filter((_, j) => j !== i));
    const updateFaq = (i: number, field: 'question' | 'answer', value: string) => {
        const updated = [...faqs];
        updated[i] = { ...updated[i], [field]: value };
        setFaqs(updated);
    };

    return (
        <>
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={product ? 'Editar Producto' : 'Nuevo Producto'}
        >
            <div className="product-modal-container">
                <div className="product-modal-sidebar">
                    {tabs.map(tab => {
                        const hasError = tab === 'Datos Básicos' && Object.keys(fieldErrors).length > 0;
                        return (
                            <button
                                key={tab}
                                className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                                onClick={() => setActiveTab(tab)}
                            >
                                {tab}
                                {hasError && <span className="tab-btn__error-dot" />}
                            </button>
                        );
                    })}
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
                                <div className={`form-group${fieldErrors.name ? ' form-group--error' : ''}`}>
                                    <label>Nombre del producto</label>
                                    <input
                                        type="text"
                                        placeholder="Ej: Remera Básica"
                                        value={name}
                                        onChange={e => { setName(e.target.value); if (fieldErrors.name) setFieldErrors(prev => { const n = {...prev}; delete n.name; return n; }); }}
                                    />
                                    {fieldErrors.name && <span className="field-error-msg">{fieldErrors.name}</span>}
                                </div>
                                <div className={`form-group${fieldErrors.category ? ' form-group--error' : ''}`}>
                                    <label>Categoría</label>
                                    <div className="cat-drop-wrapper">
                                        {catDropOpen && (
                                            <div
                                                className="cat-drop-backdrop"
                                                onClick={() => setCatDropOpen(false)}
                                            />
                                        )}
                                        <button
                                            type="button"
                                            className={`cat-drop-trigger${catDropOpen ? ' cat-drop-trigger--open' : ''}`}
                                            onClick={() => setCatDropOpen(o => !o)}
                                        >
                                            <span className={category ? '' : 'cat-drop-placeholder'}>
                                                {category || '-- Seleccionar categoría --'}
                                            </span>
                                            <svg className="cat-drop-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="6 9 12 15 18 9" />
                                            </svg>
                                        </button>
                                        {catDropOpen && (
                                            <div className="cat-drop-panel">
                                                <div
                                                    className="cat-drop-item"
                                                    onClick={() => { setCategory(''); setCatDropOpen(false); }}
                                                >
                                                    <span className="cat-drop-placeholder">-- Seleccionar categoría --</span>
                                                </div>
                                                {/* Fallback: categoría actual no encontrada en el árbol */}
                                                {category && !dbCategories.some(c => c.name.toLowerCase() === category.toLowerCase()) && (
                                                    <div
                                                        className="cat-drop-item cat-drop-item--active"
                                                        onClick={() => setCatDropOpen(false)}
                                                    >
                                                        {category}
                                                    </div>
                                                )}
                                                {dbCategories.filter(c => c.level === 1).map(root => {
                                                    const children = dbCategories.filter(c => c.parent_id === root.id);
                                                    const rootExpanded = expandedCatIds.has(root.id);
                                                    return (
                                                        <div key={root.id} className="cat-drop-group">
                                                            <div className="cat-drop-group-row">
                                                                <div
                                                                    className={`cat-drop-item cat-drop-item--root${category === root.name ? ' cat-drop-item--active' : ''}`}
                                                                    onClick={() => { setCategory(root.name); setCatDropOpen(false); setExpandedCatIds(new Set()); }}
                                                                >
                                                                    {root.name}
                                                                </div>
                                                                {children.length > 0 && (
                                                                    <button
                                                                        type="button"
                                                                        className="cat-drop-expand"
                                                                        onClick={() => toggleCatExpand(root.id)}
                                                                    >
                                                                        {rootExpanded ? '▲ ocultar' : 'ver más'}
                                                                    </button>
                                                                )}
                                                            </div>
                                                            {rootExpanded && children.map(child => {
                                                                const grandchildren = dbCategories.filter(c => c.parent_id === child.id);
                                                                const childExpanded = expandedCatIds.has(child.id);
                                                                return (
                                                                    <div key={child.id} className="cat-drop-subgroup">
                                                                        <div className="cat-drop-group-row">
                                                                            <div
                                                                                className={`cat-drop-item cat-drop-item--sub${category === child.name ? ' cat-drop-item--active' : ''}`}
                                                                                onClick={() => { setCategory(child.name); setCatDropOpen(false); setExpandedCatIds(new Set()); }}
                                                                            >
                                                                                {child.name}
                                                                            </div>
                                                                            {grandchildren.length > 0 && (
                                                                                <button
                                                                                    type="button"
                                                                                    className="cat-drop-expand cat-drop-expand--sm"
                                                                                    onClick={() => toggleCatExpand(child.id)}
                                                                                >
                                                                                    {childExpanded ? '▲ ocultar' : 'ver más'}
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                        {childExpanded && grandchildren.map(gc => (
                                                                            <div
                                                                                key={gc.id}
                                                                                className={`cat-drop-item cat-drop-item--subsub${category === gc.name ? ' cat-drop-item--active' : ''}`}
                                                                                onClick={() => { setCategory(gc.name); setCatDropOpen(false); setExpandedCatIds(new Set()); }}
                                                                            >
                                                                                {gc.name}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                    {dbCategories.length > 0 && (
                                        <button
                                            type="button"
                                            className="cat-manage-link"
                                            onClick={() => { setShowManageCatModal(true); setManageCatError(''); }}
                                        >
                                            Gestionar categorías
                                        </button>
                                    )}
                                    {fieldErrors.category && <span className="field-error-msg">{fieldErrors.category}</span>}
                                </div>
                                <div className={`form-group${fieldErrors.price ? ' form-group--error' : ''}`}>
                                    <label>Precio ($)</label>
                                    <input
                                        type="number"
                                        placeholder="0.00"
                                        value={price}
                                        onChange={e => {
                                            setPrice(e.target.value);
                                            syncPromotionFromPrice(e.target.value);
                                            if (fieldErrors.price) setFieldErrors(prev => { const n = {...prev}; delete n.price; return n; });
                                        }}
                                    />
                                    {fieldErrors.price && <span className="field-error-msg">{fieldErrors.price}</span>}
                                </div>
                                <div className={`form-group${fieldErrors.stock ? ' form-group--error' : ''}`}>
                                    <label>Stock disponible</label>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        value={stock}
                                        onChange={e => { setStock(e.target.value); if (fieldErrors.stock) setFieldErrors(prev => { const n = {...prev}; delete n.stock; return n; }); }}
                                    />
                                    {fieldErrors.stock && <span className="field-error-msg">{fieldErrors.stock}</span>}
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
                                <div className="form-group">
                                    <label>Estado</label>
                                    <select
                                        value={status}
                                        onChange={e => setStatus(e.target.value as 'active' | 'inactive')}
                                    >
                                        <option value="active">Activo</option>
                                        <option value="inactive">Inactivo</option>
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
                                    <div className="img-manager__actions">
                                        <button
                                            type="button"
                                            className="admin-btn-secondary"
                                            onClick={addImage}
                                        >
                                            + Agregar imagen
                                        </button>
                                        <button
                                            type="button"
                                            className="admin-btn-secondary"
                                            onClick={() => setPickerOpen(true)}
                                        >
                                            <Images size={14} /> Seleccionar de Cloudinary
                                        </button>
                                    </div>
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
                            <div className="variants-container">
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
                                                    <label>Opciones disponibles</label>
                                                    <div className="options-editor">
                                                        <div className="options-list">
                                                            {v.optionsText
                                                                .split(',')
                                                                .map(s => s.trim())
                                                                .filter(Boolean)
                                                                .map((option, optIdx, allOptions) => (
                                                                    <div key={optIdx} className="option-tag">
                                                                        <span>{option}</span>
                                                                        <button
                                                                            type="button"
                                                                            className="option-tag__remove"
                                                                            onClick={() => {
                                                                                const remaining = allOptions.filter((_, j) => j !== optIdx);
                                                                                updateVariant(i, 'optionsText', remaining.join(', '));
                                                                            }}
                                                                        >
                                                                            <X size={14} />
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                        </div>
                                                        <div className="option-input-group">
                                                            <input
                                                                type="text"
                                                                placeholder={`Ej: ${v.name === 'Talle' ? 'XL' : v.name === 'Material' ? 'Algodón' : 'Nueva opción'}`}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') {
                                                                        e.preventDefault();
                                                                        const newVal = e.currentTarget.value.trim();
                                                                        if (newVal && !v.optionsText.split(',').map(s => s.trim()).includes(newVal)) {
                                                                            const current = v.optionsText.split(',').map(s => s.trim()).filter(Boolean);
                                                                            updateVariant(i, 'optionsText', [...current, newVal].join(', '));
                                                                            e.currentTarget.value = '';
                                                                        }
                                                                    }
                                                                }}
                                                            />
                                                            <button
                                                                type="button"
                                                                className="option-add-btn"
                                                                onClick={(e) => {
                                                                    const input = (e.currentTarget.parentElement?.querySelector('input') as HTMLInputElement);
                                                                    if (input) {
                                                                        const newVal = input.value.trim();
                                                                        if (newVal && !v.optionsText.split(',').map(s => s.trim()).includes(newVal)) {
                                                                            const current = v.optionsText.split(',').map(s => s.trim()).filter(Boolean);
                                                                            updateVariant(i, 'optionsText', [...current, newVal].join(', '));
                                                                            input.value = '';
                                                                            input.focus();
                                                                        }
                                                                    }
                                                                }}
                                                            >
                                                                <Plus size={16} />
                                                            </button>
                                                        </div>
                                                    </div>
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
                            </div>
                            <div className="add-variant-btn-wrapper">
                                <button className="admin-btn-secondary" style={{ width: '100%' }} onClick={addVariant}>
                                    + Agregar variante
                                </button>
                            </div>
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
                                        onChange={e => {
                                            setDiscountTouched(Boolean(e.target.value));
                                            setDiscount(e.target.value);
                                            if (!e.target.value) {
                                                setOriginalPrice('');
                                                syncPromotionFromPrice(price, true);
                                            }
                                        }}
                                    />
                                    {originalPrice && price && (
                                        <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.25rem' }}>
                                            Precio original detectado: ${Number(originalPrice).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}. El precio actual se guarda como precio final.
                                        </p>
                                    )}
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

            {showCategoryModal && (
                <div
                    className="cat-modal-overlay"
                    onClick={() => { setShowCategoryModal(false); setNewCatName(''); setCategoryError(''); setNewCatParentId(null); }}
                >
                    <div className="cat-modal cat-modal--create" onClick={e => e.stopPropagation()}>
                        <h4 className="cat-modal__title">Nueva Categoría</h4>
                        <div className="form-group">
                            <label>Nombre</label>
                            <input
                                type="text"
                                placeholder="Ej: Vestidos"
                                value={newCatName}
                                onChange={e => setNewCatName(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter' && newCatName.trim()) handleCreateCategory(); }}
                                autoFocus
                            />
                        </div>
                        <div className="form-group">
                            <label>¿Dónde agregarla?</label>
                            <select
                                className="cat-parent-select"
                                value={newCatParentId ?? '__root__'}
                                onChange={e => setNewCatParentId(e.target.value === '__root__' ? null : e.target.value)}
                            >
                                <option value="__root__">— Categoría principal (nivel 1)</option>
                                {(() => {
                                    const opts: React.ReactElement[] = [];
                                    const addOpt = (cat: Category, depth: number) => {
                                        const prefix = '\u00a0\u00a0\u00a0'.repeat(depth) + (depth > 0 ? '↳ ' : '');
                                        opts.push(
                                            <option key={cat.id} value={cat.id}>
                                                {prefix}{cat.name}
                                            </option>
                                        );
                                        if (cat.level < 2) {
                                            dbCategories
                                                .filter(c => c.parent_id === cat.id)
                                                .forEach(child => addOpt(child, depth + 1));
                                        }
                                    };
                                    dbCategories.filter(c => c.level === 1).forEach(root => addOpt(root, 0));
                                    return opts;
                                })()}
                            </select>
                            <p className="cat-location-hint">
                                {newCatParentId ? (() => {
                                    const parent = dbCategories.find(c => c.id === newCatParentId);
                                    if (!parent) return null;
                                    if (parent.level === 1) {
                                        return <>Subcategoría de <strong>{parent.name}</strong></>;
                                    }
                                    const grandparent = dbCategories.find(c => c.id === parent.parent_id);
                                    return <>Subcategoría de <strong>{parent.name}</strong>{grandparent ? <> (dentro de {grandparent.name})</> : null}</>;
                                })() : 'Se creará como categoría principal'}
                            </p>
                        </div>
                        {categoryError && (
                            <p className="cat-modal__error">{categoryError}</p>
                        )}
                        <div className="cat-modal__actions">
                            <button
                                type="button"
                                className="admin-btn-secondary"
                                onClick={() => { setShowCategoryModal(false); setNewCatName(''); setCategoryError(''); setNewCatParentId(null); }}
                                disabled={savingCategory}
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                className="admin-btn-primary"
                                onClick={handleCreateCategory}
                                disabled={!newCatName.trim() || savingCategory}
                            >
                                {savingCategory ? 'Guardando...' : 'Crear categoría'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showManageCatModal && (
                <div
                    className="cat-modal-overlay"
                    onClick={() => { setShowManageCatModal(false); setManageCatError(''); }}
                >
                    <div className="cat-modal cat-modal--manage" onClick={e => e.stopPropagation()}>

                        {/* ── Header ── */}
                        <div className="cat-manage-header">
                            <div className="cat-manage-header-info">
                                <h4 className="cat-manage-title">Gestionar Categorías</h4>
                                <p className="cat-manage-subtitle">
                                    {categoryTree.length} principal{categoryTree.length !== 1 ? 'es' : ''} · {dbCategories.length} en total
                                </p>
                            </div>
                            <button
                                type="button"
                                className="cat-manage-close-btn"
                                onClick={() => { setShowManageCatModal(false); setManageCatError(''); }}
                                title="Cerrar"
                            >
                                ✕
                            </button>
                        </div>

                        {/* ── Hint ── */}
                        <div className="cat-manage-hint">
                            <p>Eliminar una categoría también elimina sus subcategorías. Pasá el cursor (o tocá) para ver las acciones.</p>
                        </div>

                        {/* ── Error ── */}
                        {manageCatError && <p className="cat-modal__error" style={{ margin: '0.6rem 1.25rem 0' }}>{manageCatError}</p>}

                        {/* ── Tree body ── */}
                        <div className="cat-manage-body">
                            {categoryTree.length === 0 ? (
                                <div className="cat-list__empty">
                                    <FolderOpen size={36} strokeWidth={1.5} className="cat-list__empty-icon" />
                                    <p>No hay categorías creadas aún.</p>
                                    <p className="cat-list__empty-sub">Usá el botón de abajo para crear la primera.</p>
                                </div>
                            ) : (
                                <div className="cat-tree">
                                    {categoryTree.map(cat => (
                                        <div key={cat.id} className="cat-tree-node">
                                            {/* Nivel 1 */}
                                            <div className="cat-tree-row cat-tree-row--1">
                                                <span className="cat-tree-icon">
                                                    <Folder size={16} strokeWidth={1.8} />
                                                </span>
                                                <span className="cat-tree-name">{cat.name}</span>
                                                {cat.children.length > 0 && (
                                                    <span className="cat-tree-badge">{cat.children.length}</span>
                                                )}
                                                <div className="cat-tree-actions">
                                                    <button
                                                        type="button"
                                                        className="cat-tree-add-btn"
                                                        title={`Agregar subcategoría en "${cat.name}"`}
                                                        onClick={() => {
                                                            setNewCatParentId(cat.id);
                                                            setShowManageCatModal(false);
                                                            setNewCatName('');
                                                            setCategoryError('');
                                                            setShowCategoryModal(true);
                                                        }}
                                                    >
                                                        <Plus size={11} strokeWidth={2.5} /> Sub
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="cat-tree-del-btn"
                                                        disabled={deletingCatId === cat.id}
                                                        onClick={() => handleDeleteCategory(cat.id, cat.name)}
                                                        title="Eliminar categoría"
                                                    >
                                                        {deletingCatId === cat.id ? '…' : <X size={13} strokeWidth={2.5} />}
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Nivel 2 */}
                                            {cat.children.length > 0 && (
                                                <div className="cat-tree-children">
                                                    {cat.children.map(sub => (
                                                        <div key={sub.id} className="cat-tree-node">
                                                            <div className="cat-tree-row cat-tree-row--2">
                                                                <span className="cat-tree-icon cat-tree-icon--sub">
                                                                    <FolderOpen size={14} strokeWidth={1.8} />
                                                                </span>
                                                                <span className="cat-tree-name cat-tree-name--sub">{sub.name}</span>
                                                                {sub.children.length > 0 && (
                                                                    <span className="cat-tree-badge">{sub.children.length}</span>
                                                                )}
                                                                <div className="cat-tree-actions">
                                                                    <button
                                                                        type="button"
                                                                        className="cat-tree-add-btn cat-tree-add-btn--sm"
                                                                        title={`Agregar subcategoría en "${sub.name}"`}
                                                                        onClick={() => {
                                                                            setNewCatParentId(sub.id);
                                                                            setShowManageCatModal(false);
                                                                            setNewCatName('');
                                                                            setCategoryError('');
                                                                            setShowCategoryModal(true);
                                                                        }}
                                                                    >
                                                                        <Plus size={10} strokeWidth={2.5} /> Sub
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        className="cat-tree-del-btn cat-tree-del-btn--sm"
                                                                        disabled={deletingCatId === sub.id}
                                                                        onClick={() => handleDeleteCategory(sub.id, sub.name)}
                                                                        title="Eliminar"
                                                                    >
                                                                        {deletingCatId === sub.id ? '…' : <X size={12} strokeWidth={2.5} />}
                                                                    </button>
                                                                </div>
                                                            </div>

                                                            {/* Nivel 3 */}
                                                            {sub.children.length > 0 && (
                                                                <div className="cat-tree-children cat-tree-children--deep">
                                                                    {sub.children.map(subsub => (
                                                                        <div key={subsub.id} className="cat-tree-row cat-tree-row--3">
                                                                            <span className="cat-tree-icon cat-tree-icon--subsub">
                                                                                <Dot size={16} strokeWidth={3} />
                                                                            </span>
                                                                            <span className="cat-tree-name cat-tree-name--subsub">{subsub.name}</span>
                                                                            <div className="cat-tree-actions">
                                                                                <button
                                                                                    type="button"
                                                                                    className="cat-tree-del-btn cat-tree-del-btn--sm"
                                                                                    disabled={deletingCatId === subsub.id}
                                                                                    onClick={() => handleDeleteCategory(subsub.id, subsub.name)}
                                                                                    title="Eliminar"
                                                                                >
                                                                                    {deletingCatId === subsub.id ? '…' : <X size={11} strokeWidth={2.5} />}
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* ── Footer ── */}
                        <div className="cat-manage-footer">
                            <button
                                type="button"
                                className="admin-btn-secondary"
                                onClick={() => {
                                    setShowManageCatModal(false);
                                    setManageCatError('');
                                    setNewCatParentId(null);
                                    setNewCatName('');
                                    setCategoryError('');
                                    setShowCategoryModal(true);
                                }}
                            >
                                + Nueva categoría
                            </button>
                            <button
                                type="button"
                                className="admin-btn-primary"
                                onClick={() => { setShowManageCatModal(false); setManageCatError(''); }}
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}

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

            {showOptionalWarning && (
                <div
                    className="cat-modal-overlay"
                    onClick={() => setShowOptionalWarning(false)}
                >
                    <div className="cat-modal optional-warning-modal" onClick={e => e.stopPropagation()}>
                        <h4 className="cat-modal__title">Campos opcionales incompletos</h4>
                        <p style={{ margin: 0, fontSize: '0.88rem', color: '#555', lineHeight: 1.6 }}>
                            ¿Estás seguro que deseas guardar el producto sin la siguiente información?
                        </p>
                        <ul className="optional-warning-list">
                            {missingOptionals.map(field => (
                                <li key={field}>{field}</li>
                            ))}
                        </ul>
                        <div className="cat-modal__actions">
                            <button
                                type="button"
                                className="admin-btn-secondary"
                                onClick={() => setShowOptionalWarning(false)}
                                disabled={saving}
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                className="admin-btn-primary"
                                onClick={() => { setShowOptionalWarning(false); executeSave(); }}
                                disabled={saving}
                            >
                                {saving ? 'Guardando...' : 'Guardar de todas formas'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Modal>

        <ConfirmationModal
            isOpen={deleteCatConfirm !== null}
            onClose={() => setDeleteCatConfirm(null)}
            title={`Eliminar "${deleteCatConfirm?.name}"`}
            message="También se eliminarán sus subcategorías. Esta acción no se puede deshacer."
            status="error"
            actionButtonText="Eliminar"
            cancelButtonText="Cancelar"
            onActionClick={confirmDeleteCategory}
        />

        <CloudinaryImagePicker
            open={pickerOpen}
            onClose={() => setPickerOpen(false)}
            onSelect={handlePickerSelect}
        />

        </>
    );
};

export default ProductModal;
