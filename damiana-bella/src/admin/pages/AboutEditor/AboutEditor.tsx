import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { useAdminStore } from '../../store/adminStore';
import { supabase } from '../../../config/supabaseClient';
import { buildCloudinaryUrl } from '../../../utils/cloudinary';
import HeroImageEditor from './HeroImageEditor';
import './AboutEditor.css';

interface HeroImageData {
  imageUrl: string;
  altText: string;
  title: string;
  backgroundPosition?: string;
}

const AboutEditor = () => {
    const { aboutInfo, updateAboutInfo } = useAdminStore();
    const [title, setTitle] = useState(aboutInfo.title);
    const [description, setDescription] = useState(aboutInfo.description);
    const [imageUrl, setImageUrl] = useState(aboutInfo.imageUrl);
    const [mission, setMission] = useState(aboutInfo.mission);
    const [vision, setVision] = useState(aboutInfo.vision);
    const [values, setValues] = useState(aboutInfo.values);
    const [saved, setSaved] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Hero Image state
    const [heroImageUrl, setHeroImageUrl] = useState('');
    const [heroAltText, setHeroAltText] = useState('');
    const [heroTitle, setHeroTitle] = useState('Lia – Tu estilo, tu esencia');
    const [heroBackgroundPosition, setHeroBackgroundPosition] = useState('50% 50%');

    useEffect(() => {
        const loadAboutInfo = async () => {
            try {
                const { data, error } = await supabase
                    .from('site_content')
                    .select('value')
                    .eq('key', 'about')
                    .single();

                if (error && error.code !== 'PGRST116') {
                    throw error;
                }

                if (data) {
                    const info = data.value as any;
                    setTitle(info.title ?? '');
                    setDescription(info.description ?? '');
                    setImageUrl(info.imageUrl ?? '');
                    setMission(info.mission ?? '');
                    setVision(info.vision ?? '');
                    setValues(info.values ?? []);
                    updateAboutInfo(info);
                }

                // Load hero image
                const { data: heroData, error: heroError } = await supabase
                    .from('site_content')
                    .select('value')
                    .eq('key', 'hero_image')
                    .single();

                if (heroError && heroError.code !== 'PGRST116') {
                    throw heroError;
                }

                if (heroData) {
                    const hero = heroData.value as HeroImageData;
                    setHeroImageUrl(hero.imageUrl ?? '');
                    setHeroAltText(hero.altText ?? '');
                    setHeroTitle(hero.title ?? 'Lia – Tu estilo, tu esencia');
                    setHeroBackgroundPosition(hero.backgroundPosition ?? '50% 50%');
                }
            } catch (err) {
                console.error('Error loading data:', err);
                setError('Error al cargar los datos.');
            } finally {
                setLoading(false);
            }
        };

        loadAboutInfo();
    }, []);

    const handleSave = async (e: { preventDefault: () => void }) => {
        e.preventDefault();
        setError(null);

        if (heroImageUrl && !heroAltText) {
            setError('Por favor, completa el texto alternativo de la imagen hero.');
            return;
        }

        const newInfo = { title, description, imageUrl, mission, vision, values };
        const heroData: HeroImageData = {
            imageUrl: heroImageUrl,
            altText: heroAltText || heroTitle,
            title: heroTitle,
            backgroundPosition: heroBackgroundPosition
        };

        try {
            const { error: aboutError } = await supabase
                .from('site_content')
                .upsert({ key: 'about', value: newInfo, updated_at: new Date().toISOString() });

            if (aboutError) {
                throw aboutError;
            }

            if (heroImageUrl) {
                const { error: heroError } = await supabase
                    .from('site_content')
                    .upsert({ key: 'hero_image', value: heroData, updated_at: new Date().toISOString() });

                if (heroError) {
                    throw heroError;
                }
            }

            updateAboutInfo(newInfo);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err) {
            console.error('Error saving:', err);
            setError('Error al guardar. Intentá de nuevo.');
        }
    };

    const handleValueChange = (index: number, field: 'title' | 'description', value: string) => {
        const newValues = [...values];
        newValues[index] = { ...newValues[index], [field]: value };
        setValues(newValues);
    };

    const addValue = () => {
        setValues([...values, { title: '', description: '' }]);
    };

    const removeValue = (index: number) => {
        setValues(values.filter((_, i) => i !== index));
    };

    if (loading) return <div className="admin-about-editor"><p>Cargando...</p></div>;

    return (
        <div className="admin-about-editor">
            <div className="admin-page-header">
                <h1 className="admin-page-title">Acerca de - Nosotros e Imagen Hero</h1>
                <p className="admin-page-subtitle">Modifica la información de la sección Sobre Nosotros y la imagen de fondo del home.</p>
            </div>

            <div className="admin-card">
                <form onSubmit={handleSave} className="about-form">
                    {/* Hero Image Section */}
                    <div style={{ borderBottom: '2px solid #eee', paddingBottom: '2rem', marginBottom: '2rem' }}>
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#333' }}>Imagen Hero - Home</h2>

                        <div className="form-group">
                            <label>Título del Hero</label>
                            <input
                                type="text"
                                value={heroTitle}
                                onChange={(e) => setHeroTitle(e.target.value)}
                                placeholder="Ej: Lia – Tu estilo, tu esencia"
                                required
                            />
                            <small>Este texto aparecerá como atributo alt si no especificas uno.</small>
                        </div>

                        <div className="form-group">
                            <label>URL de la imagen de fondo</label>
                            <input
                                type="url"
                                value={heroImageUrl}
                                onChange={(e) => setHeroImageUrl(e.target.value)}
                                placeholder="https://..."
                            />
                            <small>Pega la URL de Cloudinary o cualquier servicio de hosting de imágenes.</small>
                        </div>

                        <div className="form-group">
                            <label>Texto alternativo de la imagen</label>
                            <input
                                type="text"
                                value={heroAltText}
                                onChange={(e) => setHeroAltText(e.target.value)}
                                placeholder="Descripción para accesibilidad"
                            />
                            <small>Importante para SEO y accesibilidad.</small>
                        </div>

                        {heroImageUrl && (
                            <HeroImageEditor
                                imageUrl={buildCloudinaryUrl(heroImageUrl, {
                                    width: 800,
                                    quality: 'auto',
                                    format: 'auto'
                                })}
                                backgroundPosition={heroBackgroundPosition}
                                onPositionChange={setHeroBackgroundPosition}
                            />
                        )}
                    </div>

                    {/* About Section */}
                    <div className="form-group">
                        <label>Título de la sección</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Descripción completa</label>
                        <textarea
                            rows={8}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            required
                        ></textarea>
                    </div>

                    <div className="form-group">
                        <label>URL de la imagen principal</label>
                        <input
                            type="url"
                            value={imageUrl}
                            onChange={(e) => setImageUrl(e.target.value)}
                        />
                    </div>

                    {imageUrl && (
                        <div className="form-group">
                            <label>Vista previa de imagen</label>
                            <div className="about-preview-container">
                                <img src={imageUrl} alt="preview" className="about-preview-img" />
                            </div>
                        </div>
                    )}

                    <div className="form-group">
                        <label>Nuestra Misión</label>
                        <textarea
                            rows={4}
                            value={mission}
                            onChange={(e) => setMission(e.target.value)}
                            required
                        ></textarea>
                    </div>

                    <div className="form-group">
                        <label>Nuestra Visión</label>
                        <textarea
                            rows={4}
                            value={vision}
                            onChange={(e) => setVision(e.target.value)}
                            required
                        ></textarea>
                    </div>

                    <div className="form-group">
                        <label>Nuestros Valores</label>
                        {values.map((value, index) => (
                            <div key={index} style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                                <input
                                    type="text"
                                    placeholder="Nombre del valor (ej: Autenticidad)"
                                    value={value.title}
                                    onChange={(e) => handleValueChange(index, 'title', e.target.value)}
                                    style={{ marginBottom: '8px', width: '100%' }}
                                />
                                <textarea
                                    placeholder="Descripción"
                                    rows={2}
                                    value={value.description}
                                    onChange={(e) => handleValueChange(index, 'description', e.target.value)}
                                    style={{ marginBottom: '8px', width: '100%' }}
                                ></textarea>
                                <button
                                    type="button"
                                    onClick={() => removeValue(index)}
                                    style={{ backgroundColor: '#ff6b6b', color: 'white', padding: '6px 12px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                >
                                    Eliminar
                                </button>
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={addValue}
                            style={{ backgroundColor: '#4CAF50', color: 'white', padding: '8px 16px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                            + Agregar Valor
                        </button>
                    </div>

                    <div className="form-actions border-t pt-4 mt-6">
                        <button type="submit" className="admin-btn-primary save-btn admin-flex-center gap-2">
                            <Save size={18} /> Guardar Cambios
                        </button>
                        {saved && <span className="save-success text-green-600 font-medium">¡Guardado con éxito!</span>}
                        {error && <span className="text-red-500 font-medium">{error}</span>}
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AboutEditor;
