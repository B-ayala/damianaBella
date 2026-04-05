import { GiClothes } from 'react-icons/gi';
import './NavigationLoadingScreen.css';

const NavigationLoadingScreen = () => {
  return (
    <div
      className="navigation-loading-screen"
      role="status"
      aria-live="polite"
      aria-label="Cargando nueva sección"
    >
      <div className="navigation-loading-screen__content">
        <div className="navigation-loading-screen__icon-wrapper">
          <GiClothes className="navigation-loading-screen__icon" />
          <div className="navigation-loading-screen__spinner" />
        </div>
        <p className="navigation-loading-screen__text">Cargando...</p>
      </div>
    </div>
  );
};

export default NavigationLoadingScreen;
