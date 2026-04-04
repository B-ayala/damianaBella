import { useState, useEffect } from 'react';
import Modal from '../../../components/common/Modal/Modal';
import { supabase } from '../../../config/supabaseClient';
import { buildCloudinaryUrl } from '../../../utils/cloudinary';
import './About.css';

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

  const title = aboutInfo?.title;
  const description = aboutInfo?.description;
  const image = aboutInfo?.imageUrl;

  return (
    <div className="about-page">
      <div className="about-hero">
        <div className="about-hero-content">
          <h1 className="about-title">{title}</h1>
        </div>
      </div>

      <div className="about-container">
        <div className="about-main-content">
          <div className="about-text-section">
            <p>{description}</p>

            <button
              className="about-btn-primary"
              onClick={() => setIsModalOpen(true)}
            >
              Conócenos más
            </button>
          </div>

          <div className="about-image-section">
            <img
              src={buildCloudinaryUrl(image ?? '', {
                width: 450,
                quality: 'auto',
                format: 'auto'
              })}
              alt="Esencia de LIA"
              className="about-image"
              loading="lazy"
              decoding="async"
              width={450}
              height={600}
            />
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
              <p>{aboutInfo.mission}</p>
            </div>
          )}

          {aboutInfo?.vision && (
            <div className="modal-section">
              <p>{aboutInfo.vision}</p>
            </div>
          )}

          {aboutInfo?.values && aboutInfo.values.length > 0 && (
            <div className="modal-section">
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
