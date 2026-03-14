import { useState } from 'react';
import Modal from '../../components/common/Modal/Modal';
import './About.css';
import modelo2 from '../../assets/modelos/modelo2.png'; // Placeholder image, adapt to an about image if available later

const About = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="about-page">
      <div className="about-hero">
        <div className="about-hero-content">
          <h1 className="about-title">Nuestra Historia</h1>
          <p className="about-subtitle">Creando momentos únicos, pensando en ti.</p>
        </div>
      </div>

      <div className="about-container">
        <div className="about-main-content">
          <div className="about-text-section">
            <h2 className="section-heading">Bienvenidos a LIA</h2>
            <p>
              En LIA, creemos que la moda es mucho más que ropa; es una forma de expresión, 
              una herramienta para destacar tu confianza y una fiel compañera en tu día a día. 
              Nacimos con la idea de brindar prendas y accesorios que no solo luzcan increíbles, 
              sino que también te hagan sentir auténtica.
            </p>
            <p>
              Cada pieza en nuestra colección ha sido cuidadosamente seleccionada, priorizando 
              la calidad, el estilo atemporal y las tendencias más elegantes. Nuestro compromiso 
              es acompañarte en cada paso que das, ofreciéndote ese toque especial que completa 
              tu look perfecto.
            </p>
            
            <button 
              className="about-btn-primary" 
              onClick={() => setIsModalOpen(true)}
            >
              Conócenos más
            </button>
          </div>

          <div className="about-image-section">
            <img src={modelo2} alt="Esencia de LIA" className="about-image" />
          </div>
        </div>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="La Esencia de LIA"
      >
        <div className="about-modal-content">
          <div className="modal-section">
            <h4>Nuestra Misión</h4>
            <p>
              Inspirar confianza y autenticidad a través de colecciones exclusivas, diseñadas para 
              empoderar a quienes las llevan. Queremos que cada encuentro con nuestra marca sea 
              una experiencia cálida, amigable y memorable.
            </p>
          </div>
          
          <div className="modal-section">
            <h4>Nuestra Visión</h4>
            <p>
              Convertirnos en el referente de moda y accesorios donde la elegancia y la comodidad 
              se encuentren, siendo reconocidos por nuestro compromiso inquebrantable con la 
              calidad y la satisfacción de nuestra comunidad.
            </p>
          </div>

          <div className="modal-section">
            <h4>Nuestros Valores</h4>
            <ul className="values-list">
              <li><strong>Autenticidad:</strong> Fomentamos ser reales antes que perfectos.</li>
              <li><strong>Calidad:</strong> Ofrecemos siempre lo mejor en cada detalle.</li>
              <li><strong>Cercanía:</strong> Escuchamos y valoramos a cada miembro de nuestra comunidad.</li>
            </ul>
          </div>
          
          <p className="modal-closing">
            Gracias por ser parte de nuestra historia. ¡Estamos encantados de tenerte aquí!
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default About;
