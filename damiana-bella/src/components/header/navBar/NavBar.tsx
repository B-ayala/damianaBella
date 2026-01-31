import { Link } from 'react-router-dom';
import { FiSearch, FiUser, FiMail } from 'react-icons/fi';
import { useState } from 'react';
import './NavBar.css';

const NavBar = () => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="navbar">
      {/* Burbujas animadas */}
      <div className="bubbles">
        <div className="bubble"></div>
        <div className="bubble"></div>
        <div className="bubble"></div>
        <div className="bubble"></div>
        <div className="bubble"></div>
        <div className="bubble"></div>
        <div className="bubble"></div>
        <div className="bubble"></div>
        <div className="bubble"></div>
        <div className="bubble"></div>
      </div>
      
      <div className="navbar-container">
        {/* Logo */}
        <Link to="/" className="navbar-logo">
          DamianaBella
        </Link>

        {/* Navigation Links */}
        <div className={`navbar-links ${mobileMenuOpen ? 'active' : ''}`}>
          <Link to="/" className="nav-link" onClick={() => setMobileMenuOpen(false)}>Inicio</Link>
          <Link to="/products" className="nav-link" onClick={() => setMobileMenuOpen(false)}>Products</Link>
          <Link to="/about" className="nav-link" onClick={() => setMobileMenuOpen(false)}>About</Link>
          <Link to="/contact" className="nav-link contact-btn" onClick={() => setMobileMenuOpen(false)}>
            <FiMail className="icon" />
            Contacto
          </Link>
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
          <button className="icon-btn">
            <FiUser className="icon" />
          </button>
        </div>

        {/* Mobile Menu Toggle */}
        <button 
          className={`mobile-menu-toggle ${mobileMenuOpen ? 'active' : ''}`}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </nav>
  );
};

export default NavBar;
