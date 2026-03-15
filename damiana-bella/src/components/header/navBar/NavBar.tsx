import { Link } from 'react-router-dom';
import { FiSearch, FiChevronRight, FiArrowLeft, FiX, FiShoppingCart, FiChevronDown, FiUser } from 'react-icons/fi';
import { useState } from 'react';
import { useBodyScrollLock } from '../../../hooks/useBodyScrollLock';
import logoImg from '../../../assets/img/logo.jpeg';
import AuthModal from '../../auth/AuthModal';
import './NavBar.css';

const navItems = [
  { name: 'Inicio', path: '/', hasSubcategories: false },
  {
    name: 'Productos',
    path: '/products',
    hasSubcategories: true,
    subcategories: [
      'Zapatos',
      'Remeras / Tops',
      'Camisas / Blusas',
      'Pantalones',
      'Jeans',
      'Blazers',
      'Camperas / Abrigos',
      'Vestidos',
      'Faldas',
      'Shorts',
      'Accesorios'
    ]
  },
  { name: 'Contacto', path: '/contact', hasSubcategories: false },
  { name: 'Acerca de', path: '/about', hasSubcategories: false }
];

const NavBar = () => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  
  // Nivel de navegación: 'main' = Nivel 1, o el nombre de la categoría activa (Nivel 2)
  const [activeMenuLevel, setActiveMenuLevel] = useState<string>('main');

  useBodyScrollLock(mobileMenuOpen);

  const closeMenu = () => {
    setMobileMenuOpen(false);
    setTimeout(() => setActiveMenuLevel('main'), 300); // Restablecer luego de la animación
  };

  const currentCategory = navItems.find(item => item.name === activeMenuLevel);

  return (
    <nav className="navbar">
      {/* Burbujas animadas */}
      <div className="bubbles">
        {[...Array(10)].map((_, i) => <div key={i} className="bubble"></div>)}
      </div>
      
      <div className="navbar-container">
        {/* Mobile Menu Toggle */}
        <button 
          className="mobile-menu-toggle"
          onClick={() => setMobileMenuOpen(true)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        {/* Logo */}
        <Link to="/" className="navbar-logo" onClick={closeMenu}>
          <img src={logoImg} alt="LIA Logo" className="logo-img" />
        </Link>

        {/* Desktop Navigation */}
        <div className="desktop-nav hide-mobile">
          <ul className="desktop-nav-list">
            {navItems.map((item) => (
              <li key={item.name} className="desktop-nav-item">
                <Link to={item.path} className="desktop-nav-link">
                  {item.name}
                  {item.hasSubcategories && <FiChevronDown className="desktop-nav-arrow" />}
                </Link>
                {item.hasSubcategories && (
                  <div className="desktop-dropdown">
                    <ul className="desktop-dropdown-list">
                      {item.subcategories?.map((sub, idx) => (
                        <li key={idx} className="desktop-dropdown-item">
                          <Link 
                            to={`/products?category=${item.name}&subcategory=${sub}`} 
                            className="desktop-dropdown-link"
                          >
                            {sub}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Mobile Overlay */}
        <div 
          className={`mobile-overlay ${mobileMenuOpen ? 'active' : ''}`} 
          onClick={closeMenu}
        />

        {/* Menú Principal Deslizable */}
        <div className={`nav-menu-slider ${mobileMenuOpen ? 'active' : ''}`}>
          
          {/* --- Nivel 1: Menú Principal --- */}
          <div className={`nav-menu-level level-main ${activeMenuLevel !== 'main' ? 'slide-out' : ''}`}>
            <div className="nav-menu-header">
              <span className="nav-menu-title">Menú</span>
              <button className="nav-menu-close" onClick={closeMenu}>
                <FiX />
              </button>
            </div>
            
            <ul className="nav-menu-list">
              {navItems.map((item) => (
                <li key={item.name} className="nav-menu-item">
                  {item.hasSubcategories ? (
                    <button 
                      className="nav-link-btn" 
                      onClick={() => setActiveMenuLevel(item.name)}
                    >
                      {item.name}
                      <FiChevronRight className="nav-link-arrow" />
                    </button>
                  ) : (
                    <Link 
                      to={item.path} 
                      className="nav-link" 
                      onClick={closeMenu}
                    >
                      {item.name}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* --- Nivel 2: Subcategorías --- */}
          <div className={`nav-menu-level level-sub ${activeMenuLevel !== 'main' ? 'slide-in' : ''}`}>
             <div className="nav-menu-header">
              <button className="nav-menu-back" onClick={() => setActiveMenuLevel('main')}>
                <FiArrowLeft />
              </button>
              <span className="nav-menu-title">{currentCategory?.name.toUpperCase()}</span>
              <button className="nav-menu-close" onClick={closeMenu}>
                <FiX />
              </button>
            </div>

            <ul className="nav-menu-list">
              {currentCategory?.subcategories?.map((sub, idx) => (
                <li key={idx} className="nav-menu-item">
                  <Link 
                    to={`/products?category=${currentCategory.name}&subcategory=${sub}`} 
                    className={`nav-link ${idx === 0 ? 'view-all-link' : ''}`}
                    onClick={closeMenu}
                  >
                    {sub}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right Side Icons */}
        <div className="navbar-right">
          <div className="search-container">
            <button 
              className="icon-btn"
              onClick={() => setSearchOpen(!searchOpen)}
            >
              <FiSearch className="icon" />
            </button>
            {searchOpen && (
              <input
                type="text"
                placeholder="Buscar productos..."
                className="search-input"
                autoFocus
              />
            )}
          </div>
          <button 
            className="login-btn hide-mobile"
            onClick={() => setIsAuthModalOpen(true)}
          >
            Login
          </button>
          <button 
            className="icon-btn hide-desktop"
            onClick={() => setIsAuthModalOpen(true)}
          >
            <FiUser className="icon" />
          </button>
          <button className="icon-btn">
            <FiShoppingCart className="icon" />
          </button>
        </div>
      </div>
      
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
    </nav>
  );
};

export default NavBar;
