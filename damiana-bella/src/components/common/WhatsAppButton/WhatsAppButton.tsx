import React, { useState, useEffect } from 'react';
import { FaWhatsapp } from 'react-icons/fa';
import { WHATSAPP_NUMBER, WHATSAPP_DEFAULT_MESSAGE } from '../../../utils/constants';

const WhatsAppButton: React.FC = () => {
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_DEFAULT_MESSAGE)}`;

  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsModalOpen(document.body.style.overflow === 'hidden');
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ['style'] });
    return () => observer.disconnect();
  }, []);

  if (isModalOpen) return null;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contactar por WhatsApp"
      style={{
        position: 'fixed',
        width: '60px',
        height: '60px',
        bottom: '40px',
        right: '40px',
        backgroundColor: '#25d366',
        color: '#FFF',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
        zIndex: 1000,
        textDecoration: 'none',
        transition: 'all 0.3s ease',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLAnchorElement;
        el.style.backgroundColor = '#1ebe57';
        el.style.transform = 'scale(1.1)';
        el.style.boxShadow = '0 2px 15px rgba(0, 0, 0, 0.3)';
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLAnchorElement;
        el.style.backgroundColor = '#25d366';
        el.style.transform = 'scale(1)';
        el.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.2)';
      }}
    >
      <FaWhatsapp size={35} />
    </a>
  );
};

export default WhatsAppButton;
