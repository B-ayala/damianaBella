import { useState, useEffect } from 'react';
import Modal from '../../../components/common/Modal/Modal';
import { supabase } from '../../../config/supabaseClient';
import './About.css';
import modelo2 from '../../../assets/modelos/modelo2.png';

interface AboutInfo {
  title: string;
  description: string;
  imageUrl: string;
  mission?: string;
  vision?: string;
  values?: { title: string; description: string }[];
}

const About = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [aboutInfo, setAboutInfo] = useState<AboutInfo | null>(null);

  useEffect(() => {
    const loadAbout = async () => {
      const { data } = await supabase
        .from('site_content')
        .select('value')
        .eq('key', 'about')
        .single();

      if (data) {
        setAboutInfo(data.value as AboutInfo);
      }
    };

    loadAbout();
  }, []);

  const title = aboutInfo?.title || 'Nuestra Historia';
  const description = aboutInfo?.description || 'En LIA, creemos que la moda es mucho más que ropa; es una forma de expresión, una herramienta para destacar tu confianza y una fiel compañera en tu día a día.';
  const image = aboutInfo?.imageUrl || modelo2;

  return (
    <div className="about-page">
      <div className="about-hero">
        <div className="about-hero-content">
          <h1 className="about-title">{title}</h1>
          <p className="about-subtitle">Creando momentos únicos, pensando en ti.</p>
        </div>
      </div>

      <div className="about-container">
        <div className="about-main-content">
          <div className="about-text-section">
            <h2 className="section-heading">Bienvenidos a LIA</h2>
            <p>{description}</p>

            <button
              className="about-btn-primary"
              onClick={() => setIsModalOpen(true)}
            >
              Conócenos más
            </button>
          </div>

          <div className="about-image-section">
            <img src={image} alt="Esencia de LIA" className="about-image" />
          </div>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="La Esencia de LIA"
      >
        <div className="about-modal-content">
          {aboutInfo?.mission && (
            <div className="modal-section">
              <h4>Nuestra Misión</h4>
              <p>{aboutInfo.mission}</p>
            </div>
          )}

          {aboutInfo?.vision && (
            <div className="modal-section">
              <h4>Nuestra Visión</h4>
              <p>{aboutInfo.vision}</p>
            </div>
          )}

          {aboutInfo?.values && aboutInfo.values.length > 0 && (
            <div className="modal-section">
              <h4>Nuestros Valores</h4>
              <ul className="values-list">
                {aboutInfo.values.map((value, index) => (
                  <li key={index}><strong>{value.title}:</strong> {value.description}</li>
                ))}
              </ul>
            </div>
          )}

          <p className="modal-closing">
            Gracias por ser parte de nuestra historia. ¡Estamos encantados de tenerte aquí!
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default About;
