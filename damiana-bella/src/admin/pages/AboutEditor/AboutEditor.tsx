import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { useAdminStore } from '../../store/adminStore';
import { supabase } from '../../../config/supabaseClient';
import './AboutEditor.css';

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

    useEffect(() => {
        const loadAboutInfo = async () => {
            const { data, error } = await supabase
                .from('site_content')
                .select('value')
                .eq('key', 'about')
                .single();

            if (error) {
                setError('Error al cargar los datos.');
            } else if (data) {
                const info = data.value as any;
                setTitle(info.title ?? '');
                setDescription(info.description ?? '');
                setImageUrl(info.imageUrl ?? '');
                setMission(info.mission ?? '');
                setVision(info.vision ?? '');
                setValues(info.values ?? []);
                updateAboutInfo(info);
            }
            setLoading(false);
        };

        loadAboutInfo();
    }, []);

    const handleSave = async (e: { preventDefault: () => void }) => {
        e.preventDefault();
        setError(null);
        const newInfo = { title, description, imageUrl, mission, vision, values };

        const { error } = await supabase
            .from('site_content')
            .upsert({ key: 'about', value: newInfo, updated_at: new Date().toISOString() });

        if (error) {
            setError('Error al guardar. Intentá de nuevo.');
        } else {
            updateAboutInfo(newInfo);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
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
                <h1 className="admin-page-title">Nosotros Editor</h1>
                <p className="admin-page-subtitle">Modifica la información de la sección Sobre Nosotros.</p>
            </div>

            <div className="admin-card">
                <form onSubmit={handleSave} className="about-form">
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
