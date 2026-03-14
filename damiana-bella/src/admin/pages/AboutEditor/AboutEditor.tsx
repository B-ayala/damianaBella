import { useState } from 'react';
import { Save } from 'lucide-react';
import { useAdminStore } from '../../store/adminStore';
import './AboutEditor.css';

const AboutEditor = () => {
    const { aboutInfo, updateAboutInfo } = useAdminStore();
    const [title, setTitle] = useState(aboutInfo.title);
    const [description, setDescription] = useState(aboutInfo.description);
    const [imageUrl, setImageUrl] = useState(aboutInfo.imageUrl);
    const [saved, setSaved] = useState(false);

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        updateAboutInfo({ title, description, imageUrl });
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

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

                    <div className="form-actions border-t pt-4 mt-6">
                        <button type="submit" className="admin-btn-primary save-btn admin-flex-center gap-2">
                            <Save size={18} /> Guardar Cambios
                        </button>
                        {saved && <span className="save-success text-green-600 font-medium">¡Guardado con éxito!</span>}
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AboutEditor;
