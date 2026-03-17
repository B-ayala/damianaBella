import { useState } from 'react';
import { FiMail, FiMapPin } from 'react-icons/fi';
import { FaWhatsapp, FaTiktok, FaFacebook } from 'react-icons/fa';
import Modal from '../../../components/common/Modal/Modal';
import { CONTACT_EMAIL, SOCIAL_LINKS } from '../../../utils/constants';
import './Contact.css';

const Contact = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Formulario simulado
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsModalOpen(false);
    alert('¡Mensaje enviado con éxito! Te contactaremos pronto.');
  };

  return (
    <div className="contact-page">
      <div className="contact-header">
        <h1>Siempre cerca de ti</h1>
        <p>¿Tienes alguna duda, sugerencia o simplemente quieres saludarnos? ¡Nos encantaría escucharte!</p>
      </div>

      <div className="contact-container">
        <div className="contact-options">
          
          <div className="contact-card">
            <div className="contact-icon-wrapper">
              <FaWhatsapp className="contact-icon" />
            </div>
            <h3>WhatsApp</h3>
            <p>Escríbenos para ayudarte con tus compras o consultas.</p>
            <a
              href={SOCIAL_LINKS.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="contact-btn"
              style={{ display: 'inline-block', textDecoration: 'none', textAlign: 'center' }}
            >
              Iniciar Chat
            </a>
          </div>

          <div className="contact-card">
            <div className="contact-icon-wrapper">
              <FaTiktok className="contact-icon" style={{ marginRight: '10px' }} />
              <FaFacebook className="contact-icon" />
            </div>
            <h3>Redes Sociales</h3>
            <p>Únete a nuestra comunidad, síguenos y comparte tus looks.</p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <a href={SOCIAL_LINKS.tiktok} target="_blank" rel="noopener noreferrer" className="contact-link">TikTok</a>
              <a href={SOCIAL_LINKS.facebook} target="_blank" rel="noopener noreferrer" className="contact-link">Facebook</a>
            </div>
          </div>

          <div className="contact-card">
            <div className="contact-icon-wrapper">
              <FiMail className="contact-icon" />
            </div>
            <h3>Correo Electrónico</h3>
            <p>Escríbenos directamente y te responderemos a la brevedad.</p>
            <a href={`mailto:${CONTACT_EMAIL}`} className="contact-link" style={{ marginBottom: '10px', display: 'block' }}>{CONTACT_EMAIL}</a>
            <button 
              className="contact-btn"
              onClick={() => setIsModalOpen(true)}
            >
              Envíanos un mensaje
            </button>
          </div>

        </div>
        
        <div className="contact-footer-note" style={{ display: 'flex', flexDirection: 'column', gap: '5px', textAlign: 'center' }}>
          <div>
            <FiMapPin className="inline-icon" style={{ marginRight: '5px' }} />
            <span>Avelino Díaz & Alfonsina Storni, Villa Celina, Buenos Aires</span>
          </div>
          <p>Hacemos envíos a todo el país. Llevamos LIA hasta la puerta de tu casa.</p>
        </div>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Envíanos un mensaje"
      >
        <div className="contact-form-container">
          <p className="form-intro">Completa el siguiente formulario y nos pondremos en contacto contigo lo antes posible. ¡Gracias por elegirnos!</p>
          
          <form className="contact-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Nombre</label>
              <input type="text" id="name" placeholder="Tu nombre" required />
            </div>
            
            <div className="form-group">
              <label htmlFor="email">Correo electrónico</label>
              <input type="email" id="email" placeholder="tu@email.com" required />
            </div>
            
            <div className="form-group">
              <label htmlFor="subject">Asunto</label>
              <select id="subject" required>
                <option value="">Selecciona una opción</option>
                <option value="consulta">Consulta sobre producto</option>
                <option value="envio">Estado de envío</option>
                <option value="devolucion">Cambio o Devolución</option>
                <option value="otro">Otro</option>
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="message">Mensaje</label>
              <textarea id="message" rows={4} placeholder="¿En qué podemos ayudarte?" required></textarea>
            </div>
            
            <button type="submit" className="submit-btn">Enviar Mensaje</button>
          </form>
        </div>
      </Modal>
    </div>
  );
};

export default Contact;
