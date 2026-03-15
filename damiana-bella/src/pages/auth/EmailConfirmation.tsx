import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { verifyEmailConfirmation } from '../../services/userService';
import ConfirmationModal from '../../components/common/Modal/ConfirmationModal';
import './EmailConfirmation.css';

const EmailConfirmation = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        // Obtener el token del query parameter
        const token = searchParams.get('token_hash');
        
        if (!token) {
          setStatus('error');
          setMessage('Token de verificación no encontrado.');
          setIsModalOpen(true);
          return;
        }

        // Verificar el token
        const result = await verifyEmailConfirmation(token);
        setStatus('success');
        setMessage(result.message + ' Ya puedes iniciar sesión con tu cuenta.');
        setIsModalOpen(true);
      } catch (error) {
        setStatus('error');
        const errorMessage = error instanceof Error ? error.message : 'Error al verificar el email';
        setMessage(errorMessage);
        setIsModalOpen(true);
      }
    };

    verifyEmail();
  }, [searchParams]);

  const handleModalClose = () => {
    setIsModalOpen(false);
    if (status === 'success') {
      // Redirigir a la home después de 1 segundo
      setTimeout(() => {
        navigate('/');
      }, 500);
    }
  };

  return (
    <div className="email-confirmation-page">
      {status === 'loading' && (
        <div className="confirmation-loading">
          <div className="spinner"></div>
          <p>Verificando tu correo electrónico...</p>
        </div>
      )}

      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        status={status}
        title={status === 'success' ? 'Confirmación Exitosa' : 'Error de Verificación'}
        message={message}
      />
    </div>
  );
};

export default EmailConfirmation;
