import { useState, useRef, useEffect } from 'react';
import { FiUser, FiLock, FiLogOut, FiChevronDown } from 'react-icons/fi';
import { Divider } from '@mui/material';
import ChangePasswordModal from './ChangePasswordModal';
import './UserProfileDropdown.css';

interface UserProfileDropdownProps {
  user: { name: string; email: string };
  onLogout: () => void;
}

const UserProfileDropdown = ({ user, onLogout }: UserProfileDropdownProps) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isDropdownOpen]);

  const handleChangePasswordClick = () => {
    setIsDropdownOpen(false);
    setIsPasswordModalOpen(true);
  };

  const handleLogoutClick = async () => {
    setIsDropdownOpen(false);
    await onLogout();
  };

  return (
    <>
      <div className="profile-dropdown-wrapper" ref={dropdownRef}>
        <button
          className="login-btn hide-mobile"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          title={`Perfil de ${user.name}`}
        >
          <FiUser className="icon" style={{ marginRight: '0.5rem' }} />
          {user.name}
          <FiChevronDown
            className="icon"
            style={{
              marginLeft: '0.5rem',
              transition: 'transform 0.3s ease',
              transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
          />
        </button>

        {isDropdownOpen && (
          <div className="profile-dropdown-menu">
            {/* Cambiar contraseña */}
            <button
              className="profile-dropdown-item"
              onClick={handleChangePasswordClick}
            >
              <FiLock size={18} />
              <span>Cambiar contraseña</span>
            </button>

            {/* Divider */}
            <Divider
              sx={{
                my: '0.25rem',
                borderColor: 'rgba(184,165,200,0.2)',
              }}
            />

            {/* Cerrar sesión */}
            <button
              className="profile-dropdown-item logout-item"
              onClick={handleLogoutClick}
            >
              <FiLogOut size={18} />
              <span>Cerrar sesión</span>
            </button>
          </div>
        )}
      </div>

      {/* Modal de cambio de contraseña */}
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
    </>
  );
};

export default UserProfileDropdown;
