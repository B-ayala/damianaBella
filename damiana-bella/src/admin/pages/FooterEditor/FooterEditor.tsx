import { useState } from 'react';
import { Save } from 'lucide-react';
import { useAdminStore } from '../../store/adminStore';
import './FooterEditor.css';

const FooterEditor = () => {
    const { footerInfo, updateFooterInfo } = useAdminStore();

    const [brandName, setBrandName] = useState(footerInfo.brandName);
    const [description, setDescription] = useState(footerInfo.description);
    const [whatsapp, setWhatsapp] = useState(footerInfo.whatsapp);
    const [email, setEmail] = useState(footerInfo.email);
    const [tiktokUser, setTiktokUser] = useState(footerInfo.tiktokUser);
    const [tiktokUrl, setTiktokUrl] = useState(footerInfo.tiktokUrl);
    const [facebookUser, setFacebookUser] = useState(footerInfo.facebookUser);
    const [facebookUrl, setFacebookUrl] = useState(footerInfo.facebookUrl);
    const [address, setAddress] = useState(footerInfo.address);
    const [mapQuery, setMapQuery] = useState(footerInfo.mapQuery);
    const [copyright, setCopyright] = useState(footerInfo.copyright);
    const [saved, setSaved] = useState(false);

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        updateFooterInfo({
            brandName, description, whatsapp, email,
            tiktokUser, tiktokUrl, facebookUser, facebookUrl,
            address, mapQuery, copyright
        });
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    return (
        <div className="admin-footer-editor">
            <div className="admin-page-header">
                <h1 className="admin-page-title">Configuración del sitio</h1>
                <p className="admin-page-subtitle">Editá el contenido del footer que aparece en la tienda.</p>
            </div>

            <div className="admin-card">
                <form onSubmit={handleSave} className="footer-editor-form">
                    {/* Marca */}
                    <h3 className="footer-editor-section-title">Marca</h3>
                    <div className="footer-editor-grid">
                        <div className="form-group">
                            <label>Nombre de la marca</label>
                            <input type="text" value={brandName} onChange={(e) => setBrandName(e.target.value)} required />
                        </div>
                        <div className="form-group">
                            <label>Copyright</label>
                            <input type="text" value={copyright} onChange={(e) => setCopyright(e.target.value)} required />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Descripción del footer</label>
                        <textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} required></textarea>
                    </div>

                    {/* Contacto */}
                    <h3 className="footer-editor-section-title">Contacto</h3>
                    <div className="footer-editor-grid">
                        <div className="form-group">
                            <label>WhatsApp</label>
                            <input type="text" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label>Email</label>
                            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                        </div>
                    </div>

                    {/* Redes sociales */}
                    <h3 className="footer-editor-section-title">Redes sociales</h3>
                    <div className="footer-editor-grid">
                        <div className="form-group">
                            <label>TikTok usuario</label>
                            <input type="text" value={tiktokUser} onChange={(e) => setTiktokUser(e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label>TikTok URL</label>
                            <input type="url" value={tiktokUrl} onChange={(e) => setTiktokUrl(e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label>Facebook usuario</label>
                            <input type="text" value={facebookUser} onChange={(e) => setFacebookUser(e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label>Facebook URL</label>
                            <input type="url" value={facebookUrl} onChange={(e) => setFacebookUrl(e.target.value)} />
                        </div>
                    </div>

                    {/* Ubicación */}
                    <h3 className="footer-editor-section-title">Ubicación</h3>
                    <div className="form-group">
                        <label>Dirección</label>
                        <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label>Query del mapa (URL-encoded para Google Maps)</label>
                        <input type="text" value={mapQuery} onChange={(e) => setMapQuery(e.target.value)} />
                    </div>

                    {mapQuery && (
                        <div className="form-group">
                            <label>Vista previa del mapa</label>
                            <div className="footer-editor-map-preview">
                                <iframe
                                    title="Mapa preview"
                                    src={`https://maps.google.com/maps?q=${mapQuery}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                                    width="100%"
                                    height="220"
                                    style={{ border: 0 }}
                                    allowFullScreen={false}
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                ></iframe>
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

export default FooterEditor;
