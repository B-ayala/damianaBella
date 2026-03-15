import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, Grow, Box, Typography, Stack, Button, useMediaQuery } from '@mui/material';
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
  const isMobile = useMediaQuery('(max-width:639px)');
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
  const [emailErrorType, setEmailErrorType] = useState<'confirmed' | 'pending' | null>(null);
  
  // Email confirmation modal state
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [confirmedEmail, setConfirmedEmail] = useState('');
  const [confirmationError, setConfirmationError] = useState('');

  // Cooldown para reenvío de email
  const [resendCooldown, setResendCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startCooldown = (seconds = 60) => {
    setResendCooldown(seconds);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) {
          clearInterval(cooldownRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    return () => { if (cooldownRef.current) clearInterval(cooldownRef.current); };
  }, []);

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
    setEmailErrorType(null);
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

  const handleLoginSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
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

  const handleRegisterSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setServerError('');
    setSuccessMessage('');
    setEmailErrorType(null);

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
      if (message === 'EMAIL_ALREADY_CONFIRMED') {
        setEmailErrorType('confirmed');
        setServerError('confirmed');
      } else if (message === 'EMAIL_PENDING_CONFIRMATION') {
        setEmailErrorType('pending');
        setServerError('pending');
      } else {
        setEmailErrorType(null);
        setServerError(message);
      }
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
      startCooldown(60);
      setTimeout(() => {
        setSuccessMessage('');
        setView('login');
      }, 4000);
      setRegisterEmail('');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al reenviar el email';
      setServerError(message);
      if (message.toLowerCase().includes('demasiados intentos') || message.toLowerCase().includes('rate limit')) {
        startCooldown(60);
      }
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
      startCooldown(60);
      setConfirmationError('');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al reenviar el email';
      setConfirmationError(message);
      if (message.toLowerCase().includes('demasiados intentos') || message.toLowerCase().includes('rate limit')) {
        startCooldown(60);
      }
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

              {emailErrorType === 'confirmed' && (
                <div className="auth-server-error">
                  <div>Ya existe una cuenta con este correo. ¿Querés iniciar sesión?</div>
                  <button
                    type="button"
                    onClick={() => { setServerError(''); setEmailErrorType(null); setView('login'); }}
                    className="auth-resend-btn"
                  >
                    Ir a Iniciar sesión
                  </button>
                </div>
              )}
              {emailErrorType === 'pending' && (
                <div className="auth-server-error">
                  <div>Este correo ya fue registrado pero todavía no fue confirmado. Revisá tu bandeja de entrada (o spam).</div>
                  <button
                    type="button"
                    onClick={handleResendEmail}
                    disabled={isResendingEmail || resendCooldown > 0}
                    className="auth-resend-btn"
                  >
                    {isResendingEmail ? 'Reenviando...' : resendCooldown > 0 ? `Reenviar en ${resendCooldown}s` : 'Reenviar email de confirmación'}
                  </button>
                </div>
              )}
              {!emailErrorType && serverError && (
                <div className="auth-server-error">
                  <div>{serverError}</div>
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
      <Dialog
        open={showConfirmationModal}
        onClose={handleCloseConfirmationModal}
        fullScreen={isMobile}
        fullWidth
        maxWidth={false}
        slots={{ transition: Grow }}
        slotProps={{ transition: { timeout: 350 } }}
        sx={{
          zIndex: 2100,
          '& .MuiBackdrop-root': {
            background: 'linear-gradient(135deg, rgba(184,165,200,0.4) 0%, rgba(0,0,0,0.5) 100%)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          },
          '& .MuiDialog-paper': {
            background: 'linear-gradient(145deg, #ffffff 0%, #fafafa 100%)',
            borderRadius: isMobile ? 0 : '20px',
            boxShadow: '0 25px 80px -20px rgba(184,165,200,0.4), 0 15px 40px -10px rgba(0,0,0,0.2)',
            border: '1px solid rgba(255,255,255,0.6)',
            overflow: 'hidden',
            position: 'relative',
            maxWidth: '480px',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: 'linear-gradient(90deg, var(--primary-color) 0%, var(--primary-light) 50%, var(--primary-color) 100%)',
              zIndex: 1,
            },
          },
        }}
      >
        <DialogContent
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: { xs: '0.75rem', sm: '1rem' },
            p: { xs: '1.5rem 1rem', sm: '2rem 1.5rem' },
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: { xs: 60, sm: 70 },
              height: { xs: 60, sm: 70 },
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(102,126,234,0.1), rgba(118,75,162,0.1))',
              flexShrink: 0,
            }}
          >
            <Box
              component="svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              sx={{
                width: { xs: 32, sm: 40 },
                height: { xs: 32, sm: 40 },
                color: 'var(--primary-color)',
              }}
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              <path d="M9 10h.01M15 10h.01" />
            </Box>
          </Box>

          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: 'var(--text-dark)',
              fontFamily: "'Poppins', sans-serif",
              fontSize: { xs: '1.1rem', sm: '1.3rem' },
              lineHeight: 1.2,
            }}
          >
            Revisa tu correo electrónico
          </Typography>

          <Typography sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' }, color: '#666', fontWeight: 500 }}>
            Hemos enviado un enlace de confirmación a:
          </Typography>

          <Box
            sx={{
              fontSize: { xs: '0.75rem', sm: '0.85rem' },
              color: 'var(--primary-color)',
              fontWeight: 600,
              background: 'rgba(102,126,234,0.08)',
              p: { xs: '0.5rem 0.75rem', sm: '0.6rem 1rem' },
              borderRadius: '6px',
              wordBreak: 'break-all',
              fontFamily: "'Courier New', monospace",
              overflowWrap: 'break-word',
              maxWidth: '100%',
            }}
          >
            {confirmedEmail}
          </Box>

          <Typography sx={{ fontSize: { xs: '0.8rem', sm: '0.85rem' }, color: '#999', lineHeight: 1.4, mt: 0.5 }}>
            Haz clic en el enlace dentro del email para confirmar tu cuenta y activarla.
          </Typography>

          {confirmationError && (
            <Box
              sx={{
                background: 'rgba(231,76,60,0.08)',
                color: '#c0392b',
                border: '1px solid rgba(231,76,60,0.2)',
                borderRadius: '6px',
                p: '0.5rem 0.75rem',
                fontSize: '0.75rem',
                fontWeight: 500,
                mt: 0.5,
                width: '100%',
              }}
            >
              {confirmationError}
            </Box>
          )}

          <Stack direction="column" spacing={1} sx={{ width: '100%', mt: 1 }}>
            <Button
              onClick={handleResendEmailFromConfirmation}
              disabled={isResendingEmail || resendCooldown > 0}
              variant="contained"
              fullWidth
              sx={{
                background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
                borderRadius: '8px',
                py: { xs: '0.65rem', sm: '0.75rem' },
                fontSize: { xs: '0.8rem', sm: '0.9rem' },
                fontWeight: 600,
                textTransform: 'none',
                fontFamily: "'Poppins', sans-serif",
                boxShadow: '0 2px 8px rgba(52,152,219,0.3)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #2980b9 0%, #2471a3 100%)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 12px rgba(52,152,219,0.4)',
                },
                '&:active': { transform: 'scale(0.98)' },
                '&.Mui-disabled': { opacity: 0.65, color: 'white', background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)' },
              }}
            >
              {isResendingEmail ? 'Reenviando...' : resendCooldown > 0 ? `Reenviar en ${resendCooldown}s` : '¿No te llegó el correo? Reenviar'}
            </Button>

            <Button
              onClick={handleCloseConfirmationModal}
              variant="outlined"
              fullWidth
              sx={{
                color: 'var(--primary-dark)',
                borderColor: 'var(--primary-color)',
                borderWidth: 2,
                borderRadius: '8px',
                py: { xs: '0.65rem', sm: '0.75rem' },
                fontSize: { xs: '0.8rem', sm: '0.9rem' },
                fontWeight: 600,
                textTransform: 'none',
                fontFamily: "'Poppins', sans-serif",
                '&:hover': {
                  background: 'rgba(102,126,234,0.08)',
                  borderColor: 'var(--primary-color)',
                  borderWidth: 2,
                  transform: 'translateY(-1px)',
                },
                '&:active': { transform: 'scale(0.98)' },
              }}
            >
              Volver a Iniciar Sesión
            </Button>
          </Stack>
        </DialogContent>
      </Dialog>
    </Modal>
  );
};

export default AuthModal;
