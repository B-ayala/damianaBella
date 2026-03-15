import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../config/supabaseClient';
import { verifyEmailConfirmation } from '../../services/userService';
import ConfirmationModal from '../../components/common/Modal/ConfirmationModal';
import './EmailConfirmation.css';

const EmailConfirmation = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const resolved = useRef(false);

  const showResult = (s: 'success' | 'error', msg: string) => {
    if (resolved.current) return;
    resolved.current = true;
    setStatus(s);
    setMessage(msg);
    setIsModalOpen(true);
  };

  useEffect(() => {
    const token = searchParams.get('token_hash');

    const syncProfileName = async (userId: string, name: string) => {
      if (!name) return;
      await supabase.from('profiles').update({ name }).eq('id', userId);
    };

    if (token) {
      // Flow 1: token_hash en query params (verificación directa)
      verifyEmailConfirmation(token)
        .then(async () => {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await syncProfileName(user.id, user.user_metadata?.name);
          }
          showResult('success', '¡Cuenta confirmada correctamente! Ya puedes iniciar sesión con tu cuenta.');
        })
        .catch((err) => showResult('error', err instanceof Error ? err.message : 'Error al verificar el email'));
      return;
    }

    // Flow 2: Redirect de Supabase con tokens en el hash de la URL
    const hash = window.location.hash;
    if (hash && hash.includes('access_token')) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          await syncProfileName(session.user.id, session.user.user_metadata?.name);
          showResult('success', '¡Cuenta confirmada correctamente! Ya puedes iniciar sesión con tu cuenta.');
          subscription.unsubscribe();
        }
      });

      // Fallback: verificar sesión después de un breve delay
      const timer = setTimeout(async () => {
        if (resolved.current) return;
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          showResult('success', '¡Cuenta confirmada correctamente! Ya puedes iniciar sesión con tu cuenta.');
        } else {
          showResult('error', 'No se pudo verificar tu correo. El enlace puede haber expirado o ser inválido.');
        }
        subscription.unsubscribe();
      }, 5000);

      return () => {
        subscription.unsubscribe();
        clearTimeout(timer);
      };
    }

    // No se encontró ningún token
    showResult('error', 'No se encontró un token de verificación válido.');
  }, [searchParams]);

  const handleModalClose = () => {
    setIsModalOpen(false);
    navigate('/');
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
        title={status === 'success' ? '¡Cuenta Confirmada!' : 'Error de Verificación'}
        message={message}
        actionButtonText={status === 'success' ? 'Ir al Inicio' : 'Volver al Inicio'}
      />
    </div>
  );
};

export default EmailConfirmation;
