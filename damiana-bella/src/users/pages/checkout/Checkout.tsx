import { useState, useEffect } from 'react';
import './Checkout.css';

const Checkout = () => {
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState('mp');

  const handlePaymentSubmit = () => {
    if (selectedPayment === 'mp') {
      window.location.href = 'https://link.mercadopago.com.ar/brianayala';
    } else if (selectedPayment === 'transfer') {
      const phoneNumber = '5491141442409';
      const message = `Hola, este es mi comprobante de transferencia y el resumen de lo que compré:
- Producto: $ 70.522,77
- Envío: Gratis
- Impuestos: $ 14.809,03
Total: $ 85.331,80`;
      const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
    } else {
      alert('Funcionalidad de transferencia bancaria próximamente.');
    }
  };

  useEffect(() => {
    // Simulamos un tiempo de carga (1.5 segundos)
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="checkout-loading-screen">
        <div className="checkout-spinner"></div>
        <p className="checkout-loading-text">Preparando tu compra...</p>
      </div>
    );
  }

  return (
    <div className="checkout-container">
      <div className="checkout-content">
        {/* COLUMNA IZQUIERDA (Flujo de compra) */}
        <div className="checkout-left-column">
          
          <section className="checkout-section">
            <h2 className="checkout-section-title">Revisá la forma de entrega</h2>
            
            <div className="checkout-address-card">
              <div className="checkout-address-info">
                <span className="checkout-address-icon">📍</span>
                <div>
                  <p className="checkout-address-text">Avelino Díaz & Alfonsina Storni</p>
                  <p className="checkout-address-subtext">Buenos Aires, Argentina</p>
                </div>
              </div>
              <button className="checkout-btn-secondary">Modificar domicilio</button>
            </div>

            <div className="checkout-shipping-options">
               <label className="checkout-radio-label">
                 <input type="radio" name="shipping" defaultChecked />
                 <span className="checkout-radio-custom"></span>
                 <div className="checkout-shipping-details">
                   <p className="checkout-shipping-method">Envío estándar</p>
                 </div>
               </label>
               <label className="checkout-radio-label">
                 <input type="radio" name="shipping" />
                 <span className="checkout-radio-custom"></span>
                 <div className="checkout-shipping-details">
                   <p className="checkout-shipping-method">Envío express</p>
                 </div>
               </label>
            </div>

            <div className="checkout-delivery-estimate">
              <p className="checkout-estimate-title">Revisá cuándo llega tu compra</p>
              <p className="checkout-estimate-date">Llega entre <strong>lunes y miércoles</strong></p>
            </div>
          </section>

          <section className="checkout-section">
            <h2 className="checkout-section-title">Elegí cómo pagar</h2>
            
            <div className="checkout-payment-methods">
              
              <label className={`checkout-payment-card ${selectedPayment === 'mp' ? 'checkout-payment-mp' : ''}`}>
                <input 
                  type="radio" 
                  name="payment" 
                  value="mp"
                  checked={selectedPayment === 'mp'}
                  onChange={(e) => setSelectedPayment(e.target.value)}
                />
                <div className="checkout-payment-info">
                  <div className="checkout-payment-header">
                    <img src="https://http2.mlstatic.com/frontend-assets/ui-navigation/5.19.1/mercadopago/logo__small.png" alt="Mercado Pago" className="checkout-mp-logo" />
                    <strong>Pagar con Mercado Pago</strong>
                  </div>
                  <p className="checkout-payment-desc">
                    Pagá con tarjeta de crédito, débito, dinero en cuenta o cuotas.
                  </p>
                  <span className="checkout-recommended-badge">Recomendado</span>
                </div>
              </label>

              <label className="checkout-payment-card">
                <input 
                  type="radio" 
                  name="payment" 
                  value="transfer"
                  checked={selectedPayment === 'transfer'}
                  onChange={(e) => setSelectedPayment(e.target.value)}
                />
                <div className="checkout-payment-info">
                  <div className="checkout-payment-header">
                    <strong>Transferencia por alias</strong>
                  </div>
                  <p className="checkout-payment-desc">
                    Realizá una transferencia bancaria por alias y coordiná el pago con el vendedor.
                  </p>
                  <div className="checkout-alias-box">
                    Alias: <strong>lia.zapatos.mp</strong>
                  </div>
                  <p className="checkout-payment-small-text">
                    Una vez realizada la transferencia deberás enviar el comprobante.
                  </p>
                </div>
              </label>

            </div>

            <button className="checkout-show-more-btn">
              Mostrar más medios de pago
            </button>

          </section>

        </div>

        {/* COLUMNA DERECHA (Resumen) */}
        <div className="checkout-right-column">
          <div className="checkout-summary-card">
            <h3 className="checkout-summary-title">Resumen de compra</h3>
            
            <ul className="checkout-summary-list">
              <li>
                <span>Producto</span>
                <span>$ 70.522,77</span>
              </li>
              <li>
                <span>Envío</span>
                <span className="checkout-text-green">Gratis</span>
              </li>
              <li>
                <span>Impuestos</span>
                <span>$ 14.809,03</span>
              </li>
            </ul>

            <div className="checkout-summary-divider"></div>
            
            <div className="checkout-summary-total">
              <span>Total</span>
              <span>$ 85.331,80</span>
            </div>

            <button 
              className="checkout-btn-primary"
              onClick={handlePaymentSubmit}
            >
              {selectedPayment === 'transfer' ? 'Enviar comprobante por WhatsApp y el resumen de lo que compro' : 'Continuar al pago'}
            </button>
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default Checkout;
