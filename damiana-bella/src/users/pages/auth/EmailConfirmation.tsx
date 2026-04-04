import { useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../../config/supabaseClient';
import { verifyEmailConfirmation } from '../../../services/userService';
import ConfirmationModal from '../../../components/common/Modal/ConfirmationModal';
import { useInitialLoadTask } from '../../../components/common/InitialLoad/InitialLoadProvider';
import './EmailConfirmation.css';

export const EMAIL_CONFIRMED_CHANNEL = 'db_email_confirmation';
export const EMAIL_CONFIRMED_STORAGE_KEY = 'db_email_confirmation_event';

const EMAIL_CONFIRMED_EVENT = 'EMAIL_CONFIRMED';

const EmailConfirmation = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const resolved = useRef(false);

  useInitialLoadTask('route', status === 'loading');

  const broadcastAndShow = () => {
    if (resolved.current) return;
    resolved.current = true;
    const payload = JSON.stringify({ type: EMAIL_CONFIRMED_EVENT, at: Date.now() });
    try {
      const ch = new BroadcastChannel(EMAIL_CONFIRMED_CHANNEL);
      ch.postMessage({ type: EMAIL_CONFIRMED_EVENT });
      ch.close();
    } catch { /* BroadcastChannel not supported */ }
    try {
      window.localStorage.setItem(EMAIL_CONFIRMED_STORAGE_KEY, payload);
    } catch {
      /* localStorage not available */
    }
    setStatus('success');
    setMessage('Tu cuenta fue confirmada correctamente. Ya podés iniciar sesión.');
    setIsModalOpen(true);
    // Intentar cerrar la pestaña automáticamente tras mostrar el mensaje
    setTimeout(() => window.close(), 1500);
  };

  const showError = (msg: string) => {
    if (resolved.current) return;
    resolved.current = true;
    setStatus('error');
    setMessage(msg);
    setIsModalOpen(true);
  };

  useEffect(() => {
    const token = searchParams.get('token_hash');
    const code = searchParams.get('code');
    const errorDescription = searchParams.get('error_description') || searchParams.get('error');
    const hash = window.location.hash;

    const syncProfileName = async (userId: string, name: string) => {
      if (!name) return;
      await supabase.from('profiles').update({ name }).eq('id', userId);
    };

    const completeWithSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user) {
        return false;
      }

      await syncProfileName(session.user.id, session.user.user_metadata?.name);
      broadcastAndShow();
      return true;
    };

    if (errorDescription) {
      showError(errorDescription);
      return;
    }

    if (token) {
      verifyEmailConfirmation(token)
        .then(async () => {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) await syncProfileName(user.id, user.user_metadata?.name);
          broadcastAndShow();
        })
        .catch((err) => showError(err instanceof Error ? err.message : 'Error al verificar el email'));
      return;
    }

    if (code) {
      supabase.auth.exchangeCodeForSession(code)
        .then(async ({ error }) => {
          if (error) {
            throw error;
          }

          const completed = await completeWithSession();
          if (!completed) {
            showError('No se pudo completar la confirmación de tu cuenta.');
          }
        })
        .catch((err) => showError(err instanceof Error ? err.message : 'Error al verificar el email'));
      return;
    }

    if (hash && hash.includes('access_token')) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session) {
          await syncProfileName(session.user.id, session.user.user_metadata?.name);
          broadcastAndShow();
          subscription.unsubscribe();
        }
      });

      const timer = setTimeout(async () => {
        if (resolved.current) return;
        const { data: { session } } = await supabase.auth.getSession();
        subscription.unsubscribe();
        if (session) {
          broadcastAndShow();
        } else {
          showError('No se pudo verificar tu correo. El enlace puede haber expirado o ser inválido.');
        }
      }, 5000);

      return () => {
        subscription.unsubscribe();
        clearTimeout(timer);
      };
    }

    completeWithSession().then((completed) => {
      if (!completed) {
        showError('No se encontró un token de verificación válido.');
      }
    });
  }, [searchParams]);

  const handleModalClose = () => {
    setIsModalOpen(false);
    if (status === 'error') navigate('/');
    else window.close();
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
        status={status === 'loading' ? 'error' : status}
        title={status === 'success' ? '¡Cuenta Confirmada!' : 'Error de Verificación'}
        message={message}
        actionButtonText={status === 'success' ? 'Cerrar pestaña' : 'Volver al Inicio'}
      />
    </div>
  );
};

export default EmailConfirmation;
