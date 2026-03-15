import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FcGoogle } from 'react-icons/fc';
import { useAdminStore } from '../../admin/store/adminStore';
import { isValidEmail } from '../../utils/validation';
import { createUser, resendConfirmationEmail } from '../../services/userService';
import Modal from '../common/Modal/Modal';
import './AuthModal.css';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AuthModal = ({ isOpen, onClose }: AuthModalProps) => {
  const navigate = useNavigate();
  const login = useAdminStore(state => state.login);
  const [view, setView] = useState<'login' | 'register'>('login');
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Register form state
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');

  // Form errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Loading & server feedback
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isResendingEmail, setIsResendingEmail] = useState(false);
  
  // Email confirmation modal state
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [confirmedEmail, setConfirmedEmail] = useState('');
  const [confirmationError, setConfirmationError] = useState('');

  // Reset state when closing
  const handleClose = () => {
    setLoginEmail('');
    setLoginPassword('');
    setRegisterName('');
    setRegisterEmail('');
    setRegisterPassword('');
    setRegisterConfirmPassword('');
    setErrors({});
    setServerError('');
    setSuccessMessage('');
    setView('login');
    setShowConfirmationModal(false);
    setConfirmedEmail('');
    setConfirmationError('');
    // Ensure small timeout to not show reset during fade out animation
    setTimeout(() => {
        onClose();
    }, 50);
  };

  const validateLogin = () => {
    const newErrors: Record<string, string> = {};
    if (!loginEmail.trim()) newErrors.loginEmail = 'El correo electrónico es requerido';
    else if (!isValidEmail(loginEmail)) newErrors.loginEmail = 'Ingresa un correo válido';
    
    if (!loginPassword.trim()) newErrors.loginPassword = 'La contraseña es requerida';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateRegister = () => {
    const newErrors: Record<string, string> = {};
    if (!registerName.trim()) newErrors.registerName = 'El nombre es requerido';
    
    if (!registerEmail.trim()) newErrors.registerEmail = 'El correo electrónico es requerido';
    else if (!isValidEmail(registerEmail)) newErrors.registerEmail = 'Ingresa un correo válido';
    
    if (!registerPassword.trim()) newErrors.registerPassword = 'La contraseña es requerida';
    else if (registerPassword.length < 6) newErrors.registerPassword = 'La contraseña debe tener al menos 6 caracteres';
    
    if (registerPassword !== registerConfirmPassword) newErrors.registerConfirmPassword = 'Las contraseñas no coinciden';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateLogin()) return;

    setServerError('');
    setIsLoading(true);
    try {
      const isAdmin = await login(loginEmail, loginPassword);
      if (isAdmin) {
        handleClose();
        navigate('/admin', { replace: true });
        return;
      }
      // Login exitoso pero no es admin — cerrar modal normalmente
      handleClose();
    } catch {
      setServerError('Error al iniciar sesión. Verifica tus credenciales.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');
    setSuccessMessage('');

    if (!validateRegister()) return;

    setIsLoading(true);
    try {
      await createUser({
        name: registerName.trim(),
        email: registerEmail.trim(),
        password: registerPassword,
      });
      
      // Mostrar modal de confirmación en lugar de redirigir automáticamente
      setConfirmedEmail(registerEmail.trim());
      setShowConfirmationModal(true);
      setConfirmationError('');
      
      // Limpiar formulario
      setRegisterName('');
      setRegisterEmail('');
      setRegisterPassword('');
      setRegisterConfirmPassword('');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al registrar el usuario';
      setServerError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendEmail = async () => {
    if (!registerEmail.trim() || !isValidEmail(registerEmail)) {
      setServerError('Por favor ingresa un correo electrónico válido');
      return;
    }

    setIsResendingEmail(true);
    setServerError('');
    try {
      const result = await resendConfirmationEmail(registerEmail.trim());
      setSuccessMessage(result.message);
      setTimeout(() => {
        setSuccessMessage('');
        setView('login');
      }, 4000);
      setRegisterEmail('');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al reenviar el email';
      setServerError(message);
    } finally {
      setIsResendingEmail(false);
    }
  };

  const handleResendEmailFromConfirmation = async () => {
    if (!confirmedEmail.trim()) {
      setConfirmationError('Error al reenviar. Por favor intenta nuevamente.');
      return;
    }

    setIsResendingEmail(true);
    setConfirmationError('');
    try {
      await resendConfirmationEmail(confirmedEmail);
      // Email reenviado exitosamente - mantener modal abierto
      setConfirmationError(''); // Clear error
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al reenviar el email';
      setConfirmationError(message);
    } finally {
      setIsResendingEmail(false);
    }
  };

  const handleCloseConfirmationModal = () => {
    setShowConfirmationModal(false);
    setConfirmedEmail('');
    setConfirmationError('');
    setView('login');
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="">
      <div className="auth-modal-container">
        <div className="auth-tabs">
          <button 
            className={`auth-tab ${view === 'login' ? 'active' : ''}`}
            onClick={() => setView('login')}
            type="button"
          >
            Iniciar Sesión
          </button>
          <button 
            className={`auth-tab ${view === 'register' ? 'active' : ''}`}
            onClick={() => setView('register')}
            type="button"
          >
            Crear Cuenta
          </button>
        </div>

        <div className="auth-content">
          {view === 'login' ? (
            <form className="auth-form" onSubmit={handleLoginSubmit} noValidate>
              <div className="form-group">
                <label htmlFor="loginEmail">Correo Electrónico</label>
                <input 
                  type="email" 
                  id="loginEmail" 
                  autoComplete="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className={errors.loginEmail ? 'error-input' : ''}
                />
                {errors.loginEmail && <span className="error-text">{errors.loginEmail}</span>}
              </div>
              
              <div className="form-group">
                <label htmlFor="loginPassword">Contraseña</label>
                <input 
                  type="password" 
                  id="loginPassword" 
                  autoComplete="current-password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className={errors.loginPassword ? 'error-input' : ''}
                />
                {errors.loginPassword && <span className="error-text">{errors.loginPassword}</span>}
              </div>
              
              <div className="auth-options">
                <a href="#" className="forgot-password">¿Olvidaste tu contraseña?</a>
              </div>

              {serverError && <div className="auth-server-error">{serverError}</div>}

              <button type="submit" className="auth-submit-btn" disabled={isLoading}>
                {isLoading ? 'Ingresando...' : 'Ingresar'}
              </button>
            </form>
          ) : (
            <form className="auth-form" onSubmit={handleRegisterSubmit} noValidate>
              <div className="form-group">
                <label htmlFor="registerName">Nombre Completo</label>
                <input 
                  type="text" 
                  id="registerName" 
                  autoComplete="name"
                  value={registerName}
                  onChange={(e) => setRegisterName(e.target.value)}
                  className={errors.registerName ? 'error-input' : ''}
                />
                {errors.registerName && <span className="error-text">{errors.registerName}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="registerEmail">Correo Electrónico</label>
                <input 
                  type="email" 
                  id="registerEmail" 
                  autoComplete="email"
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  className={errors.registerEmail ? 'error-input' : ''}
                />
                {errors.registerEmail && <span className="error-text">{errors.registerEmail}</span>}
              </div>
              
              <div className="form-group">
                <label htmlFor="registerPassword">Contraseña</label>
                <input 
                  type="password" 
                  id="registerPassword" 
                  autoComplete="new-password"
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  className={errors.registerPassword ? 'error-input' : ''}
                />
                {errors.registerPassword && <span className="error-text">{errors.registerPassword}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="registerConfirmPassword">Confirmar Contraseña</label>
                <input 
                  type="password" 
                  id="registerConfirmPassword" 
                  autoComplete="new-password"
                  value={registerConfirmPassword}
                  onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                  className={errors.registerConfirmPassword ? 'error-input' : ''}
                />
                {errors.registerConfirmPassword && <span className="error-text">{errors.registerConfirmPassword}</span>}
              </div>

              {serverError && (
                <div className="auth-server-error">
                  <div>{serverError}</div>
                  {serverError.includes('reenviar') && (
                    <button
                      type="button"
                      onClick={handleResendEmail}
                      disabled={isResendingEmail}
                      className="auth-resend-btn"
                    >
                      {isResendingEmail ? 'Reenviando...' : 'Reenviar email'}
                    </button>
                  )}
                </div>
              )}
              {successMessage && <div className="auth-success-message">{successMessage}</div>}

              <button type="submit" className="auth-submit-btn" disabled={isLoading}>
                {isLoading ? 'Registrando...' : 'Registrarse'}
              </button>
            </form>
          )}

          <div className="auth-separator">
            <span>O continuar con</span>
          </div>

          <button type="button" className="google-auth-btn">
            <FcGoogle className="google-icon" />
            <span>Continuar con Google</span>
          </button>
        </div>
      </div>

      {/* Modal de confirmación de email */}
      {showConfirmationModal && (
        <Modal isOpen={showConfirmationModal} onClose={handleCloseConfirmationModal} title="">
          <div className="confirmation-email-container">
            <div className="confirmation-email-content">
              <div className="confirmation-icon-wrapper">
                <svg className="confirmation-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                  <path d="M9 10h.01M15 10h.01"></path>
                </svg>
              </div>
              
              <h2 className="confirmation-title">Revisa tu correo electrónico</h2>
              
              <p className="confirmation-text">
                Hemos enviado un enlace de confirmación a:
              </p>
              
              <p className="confirmation-email">{confirmedEmail}</p>
              
              <p className="confirmation-description">
                Haz clic en el enlace dentro del email para confirmar tu cuenta y activarla.
              </p>

              {confirmationError && (
                <div className="confirmation-error">
                  {confirmationError}
                </div>
              )}

              <div className="confirmation-actions">
                <button
                  type="button"
                  onClick={handleResendEmailFromConfirmation}
                  disabled={isResendingEmail}
                  className="confirmation-resend-btn"
                >
                  {isResendingEmail ? 'Reenviando...' : '¿No te llegó el correo? Reenviar'}
                </button>

                <button
                  type="button"
                  onClick={handleCloseConfirmationModal}
                  className="confirmation-close-btn"
                >
                  Volver a Iniciar Sesión
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </Modal>
  );
};

export default AuthModal;
