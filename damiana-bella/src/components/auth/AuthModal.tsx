import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FcGoogle } from 'react-icons/fc';
import { useAdminStore } from '../../admin/store/adminStore';
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

  // Reset state when closing
  const handleClose = () => {
    setLoginEmail('');
    setLoginPassword('');
    setRegisterName('');
    setRegisterEmail('');
    setRegisterPassword('');
    setRegisterConfirmPassword('');
    setErrors({});
    setView('login');
    // Ensure small timeout to not show reset during fade out animation
    setTimeout(() => {
        onClose();
    }, 50);
  };

  const validateLogin = () => {
    const newErrors: Record<string, string> = {};
    if (!loginEmail.trim()) newErrors.loginEmail = 'El correo electrónico es requerido';
    else if (!/^^\S+@\S+\.\S+$/.test(loginEmail)) newErrors.loginEmail = 'Ingresa un correo válido';
    
    if (!loginPassword.trim()) newErrors.loginPassword = 'La contraseña es requerida';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateRegister = () => {
    const newErrors: Record<string, string> = {};
    if (!registerName.trim()) newErrors.registerName = 'El nombre es requerido';
    
    if (!registerEmail.trim()) newErrors.registerEmail = 'El correo electrónico es requerido';
    else if (!/^^\S+@\S+\.\S+$/.test(registerEmail)) newErrors.registerEmail = 'Ingresa un correo válido';
    
    if (!registerPassword.trim()) newErrors.registerPassword = 'La contraseña es requerida';
    else if (registerPassword.length < 6) newErrors.registerPassword = 'La contraseña debe tener al menos 6 caracteres';
    
    if (registerPassword !== registerConfirmPassword) newErrors.registerConfirmPassword = 'Las contraseñas no coinciden';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateLogin()) {
      const isAdmin = login(loginEmail, loginPassword);
      if (isAdmin) {
        handleClose();
        navigate('/admin', { replace: true });
        return;
      }
      console.log('Login attempt', { email: loginEmail, password: loginPassword });
      handleClose();
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateRegister()) {
      console.log('Register attempt', { name: registerName, email: registerEmail, password: registerPassword });
      handleClose();
    }
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

              <button type="submit" className="auth-submit-btn">Ingresar</button>
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

              <button type="submit" className="auth-submit-btn">Registrarse</button>
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
    </Modal>
  );
};

export default AuthModal;
