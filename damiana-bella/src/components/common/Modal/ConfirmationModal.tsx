import { useRef, useState, useEffect } from 'react';
import { FiX, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { useBodyScrollLock } from '../../../hooks/useBodyScrollLock';
import './ConfirmationModal.css';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  status?: 'success' | 'error' | 'info' | 'loading';
  actionButtonText?: string;
  onActionClick?: () => void;
}

const ConfirmationModal = ({
  isOpen,
  onClose,
  title,
  message,
  status = 'info',
  actionButtonText = 'Aceptar',
  onActionClick,
}: ConfirmationModalProps) => {
  const isOverlayClick = useRef(false);
  const [isClosing, setIsClosing] = useState(false);
  const [shouldRender, setShouldRender] = useState(isOpen);

  useBodyScrollLock(isOpen);

  useEffect(() => {
    if (isOpen) {
      setIsClosing(false);
      setShouldRender(true);
    } else if (shouldRender) {
      setIsClosing(true);
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [isOpen, shouldRender]);

  if (!shouldRender) return null;

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 350);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      isOverlayClick.current = true;
    } else {
      isOverlayClick.current = false;
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isOverlayClick.current && e.target === e.currentTarget) {
      handleClose();
    }
    isOverlayClick.current = false;
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'success':
        return <FiCheckCircle className="confirmation-icon success" />;
      case 'error':
        return <FiAlertCircle className="confirmation-icon error" />;
      case 'loading':
        return <div className="confirmation-spinner"></div>;
      default:
        return null;
    }
  };

  const handleActionClick = () => {
    if (onActionClick) {
      onActionClick();
    }
    handleClose();
  };

  return (
    <div
      className={`modal-overlay ${isClosing ? 'closing' : ''}`}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    >
      <div
        className={`confirmation-modal-content ${isClosing ? 'closing' : ''} ${status}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close" onClick={handleClose}>
          <FiX />
        </button>

        <div className="confirmation-body">
          {getStatusIcon()}
          <h3 className="confirmation-title">{title}</h3>
          <p className="confirmation-message">{message}</p>

          <button
            className={`confirmation-button ${status}`}
            onClick={handleActionClick}
          >
            {actionButtonText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
