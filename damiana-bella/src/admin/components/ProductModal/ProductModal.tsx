import { useState, useEffect } from 'react';
import Modal from '../../../components/common/Modal/Modal';
import { useAdminStore, type AdminProduct } from '../../store/adminStore';
import { supabase } from '../../../config/supabaseClient';
import type { Variant, Specification, FAQ } from '../../../types/product';
import './ProductModal.css';
import './ProductModalStylesExtension.css';

interface ProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: AdminProduct | null;
}

interface CloudinaryUploadResult {
    event: string;
    info?: {
        secure_url: string;
        public_id: string;
        [key: string]: unknown;
    };
}

declare global {
    interface Window {
        cloudinary: {
            openUploadWidget(
                config: Record<string, unknown>,
                callback: (error: unknown, result: CloudinaryUploadResult) => void
            ): void;
        };
    }
}

type UploadSignatureCallback = (signature: string) => void;
type UploadSignatureFunction = (
    callback: UploadSignatureCallback,
    paramsToSign: Record<string, unknown>
) => void | Promise<void>;

const tabs = ['Datos Básicos', 'Variantes', 'Promociones', 'Descripción', 'Especificaciones', 'FAQ'];

const ProductModal = ({ isOpen, onClose, product }: ProductModalProps) => {
    const { addProduct, updateProduct } = useAdminStore();
    const [activeTab, setActiveTab] = useState(tabs[0]);

    // Datos Básicos
    const [name, setName] = useState('');
    const [category, setCategory] = useState('');
    const [price, setPrice] = useState('');
    const [stock, setStock] = useState('');
    const [condition, setCondition] = useState<'new' | 'used'>('new');
    const [imageUrl, setImageUrl] = useState('');
    const [publicId, setPublicId] = useState('');
    const [uploading, setUploading] = useState(false);

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
                setPrice(product.price?.toString() || '');
                setStock(product.stock?.toString() || '');
                setCondition(product.condition || 'new');
                setImageUrl(product.imageUrl || '');
                if (product.imageUrl) {
                    const parts = product.imageUrl.split('/');
                    setPublicId(parts[parts.length - 1].split('.')[0] || '');
                }
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
        setPrice('');
        setStock('');
        setCondition('new');
        setImageUrl('');
        setPublicId('');
        setDiscount('');
        setFreeShipping(false);
        setDescription('');
        setFeaturesText('');
        setWarranty('');
        setReturnPolicy('');
        setVariants([]);
        setSpecifications([]);
        setFaqs([]);
    };

    const handleUpload = () => {
        setUploading(true);
        setError('');

        const uploadSignatureFunction: UploadSignatureFunction = async (
            callback: UploadSignatureCallback,
            paramsToSign: Record<string, unknown>
        ) => {
            try {
                const response = await fetch(
                    `${import.meta.env.VITE_API_URL_LOCAL}/cloudinary/sign`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(paramsToSign),
                    }
                );
                if (!response.ok) throw new Error(`Error al firmar: ${response.statusText}`);
                const data = await response.json();
                callback(data.data.signature);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'No se pudo obtener la firma');
            }
        };

        window.cloudinary.openUploadWidget(
            {
                cloudName: 'dnvmrfidc',
                apiKey: '212835282461621',
                uploadPreset: 'Liastore',
                folder: 'productos',
                uploadSignature: uploadSignatureFunction,
                sources: ['local', 'camera'],
                multiple: false,
                resourceType: 'image',
                cropping: false,
                showAdvancedOptions: false,
                maxFileSize: 50000000,
            },
            (uploadError: unknown, result: CloudinaryUploadResult) => {
                if (uploadError) {
                    setError('Error al subir la imagen');
                } else if (result.event === 'success' && result.info?.secure_url) {
                    setImageUrl(result.info.secure_url);
                    setPublicId(result.info.public_id || '');
                }
                setUploading(false);
            }
        );
    };

    const buildPayload = () => ({
        name,
        category,
        price: parseFloat(price),
        stock: parseInt(stock) || 0,
        imageUrl,
        publicId,
        condition,
        description,
        discount: discount ? parseFloat(discount) : null,
        freeShipping,
        variants: variants.map(v => ({
            name: v.name,
            options: v.optionsText.split(',').map(o => o.trim()).filter(Boolean),
        })) as Variant[],
        specifications,
        features: featuresText.split('\n').map(f => f.trim()).filter(Boolean),
        faqs,
        warranty,
        returnPolicy,
        status: 'active' as const,
    });

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
                const response = await fetch(
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
                const response = await fetch(`${import.meta.env.VITE_API_URL_LOCAL}/products`, {
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
                                    <input
                                        type="text"
                                        placeholder="Ej: Remeras"
                                        value={category}
                                        onChange={e => setCategory(e.target.value)}
                                    />
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
                                    <label>Imagen principal</label>
                                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                        <button
                                            type="button"
                                            className="admin-btn-primary"
                                            onClick={handleUpload}
                                            disabled={uploading}
                                            style={{ minWidth: '140px' }}
                                        >
                                            {uploading ? 'Subiendo...' : '📤 Subir imagen'}
                                        </button>
                                        {imageUrl && (
                                            <img
                                                src={imageUrl}
                                                alt="Vista previa"
                                                style={{
                                                    maxWidth: '120px',
                                                    maxHeight: '120px',
                                                    borderRadius: '0.5rem',
                                                    objectFit: 'cover',
                                                    border: '1px solid #ddd',
                                                }}
                                            />
                                        )}
                                    </div>
                                    <input
                                        type="url"
                                        placeholder="O pegá una URL manualmente..."
                                        value={imageUrl}
                                        onChange={e => setImageUrl(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── VARIANTES ── */}
                    {activeTab === 'Variantes' && (
                        <div className="tab-pane">
                            <h3>Variantes</h3>
                            <p style={{ color: '#666', fontSize: '0.88rem', marginBottom: '1rem' }}>
                                Ej: nombre "Color" con opciones "Rojo, Azul, Verde" — nombre "Talle" con opciones "S, M, L, XL"
                            </p>
                            {variants.map((v, i) => (
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
                                        <div className="form-group">
                                            <label>Opciones (separadas por coma)</label>
                                            <input
                                                type="text"
                                                placeholder="Rojo, Azul, Verde"
                                                value={v.optionsText}
                                                onChange={e => updateVariant(i, 'optionsText', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <button
                                        className="admin-btn-secondary"
                                        style={{ marginTop: '0.25rem' }}
                                        onClick={() => removeVariant(i)}
                                    >
                                        Eliminar variante
                                    </button>
                                </div>
                            ))}
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
                    disabled={saving || uploading}
                >
                    {saving ? 'Guardando...' : 'Guardar producto'}
                </button>
            </div>
        </Modal>
    );
};

export default ProductModal;
