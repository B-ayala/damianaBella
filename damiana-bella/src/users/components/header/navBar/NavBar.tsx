import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiSearch, FiChevronRight, FiArrowLeft, FiX, FiShoppingCart, FiChevronDown, FiUser, FiLogOut, FiLock } from 'react-icons/fi';
import { useBodyScrollLock } from '../../../../hooks/useBodyScrollLock';
import logoImg from '../../../../assets/img/logo.jpeg';
import AuthModal from '../../auth/AuthModal';
import UserProfileDropdown from './UserProfileDropdown';
import ChangePasswordModal from './ChangePasswordModal';
import { useAdminStore } from '../../../../admin/store/adminStore';
import { fetchCategoriesTree, type Category } from '../../../../services/productService';
import { useCartStore } from '../../../../store/cartStore';
import CartDrawer from '../../cart/CartDrawer';
import './NavBar.css';

const staticNavBefore = [{ name: 'Inicio', path: '/' }];
const staticNavAfter = [
  { name: 'Contacto', path: '/contact' },
  { name: 'Acerca de', path: '/about' },
];

function buildChildMap(cats: Category[]): Map<string | null, Category[]> {
  const map = new Map<string | null, Category[]>();
  for (const cat of cats) {
    const key = cat.parent_id;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(cat);
  }
  return map;
}

const NavBar = () => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isMobilePasswordModalOpen, setIsMobilePasswordModalOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartBump, setCartBump] = useState(false);
  const totalItems = useCartStore((s) => s.totalItems());
  const prevTotalRef = React.useRef(totalItems);

  useEffect(() => {
    if (totalItems > prevTotalRef.current) {
      setCartBump(true);
      const t = setTimeout(() => setCartBump(false), 600);
      prevTotalRef.current = totalItems;
      return () => clearTimeout(t);
    }
    prevTotalRef.current = totalItems;
  }, [totalItems]);
  const [categoryTree, setCategoryTree] = useState<Category[]>([]);
  // Mobile: track which level-1 and level-2 category the user drilled into
  const [mobileL1, setMobileL1] = useState<Category | null>(null);
  const [mobileL2, setMobileL2] = useState<Category | null>(null);
  const currentUser = useAdminStore(state => state.currentUser);
  const logout = useAdminStore(state => state.logout);

  useBodyScrollLock(mobileMenuOpen);

  useEffect(() => {
    fetchCategoriesTree().then(setCategoryTree).catch(console.error);
  }, []);

  const childMap = buildChildMap(categoryTree);
  const level1Cats = childMap.get(null) ?? [];

  // 0 = main menu, 1 = level-2 subcategories, 2 = level-3 sub-subcategories
  const mobileLevel = mobileL1 === null ? 0 : mobileL2 === null ? 1 : 2;

  const closeMenu = () => {
    setMobileMenuOpen(false);
    setTimeout(() => {
      setMobileL1(null);
      setMobileL2(null);
    }, 300);
  };

  const handleLogout = async () => { await logout(); };

  const handleMobileChangePassword = () => {
    closeMenu();
    setIsMobilePasswordModalOpen(true);
  };

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
            {staticNavBefore.map(item => (
              <li key={item.name} className="desktop-nav-item">
                <Link to={item.path} className="desktop-nav-link">{item.name}</Link>
              </li>
            ))}

            {level1Cats.length > 0 && (
              <li className="desktop-nav-item">
                <Link to="/products" className="desktop-nav-link">
                  Productos
                  <FiChevronDown className="desktop-nav-arrow" />
                </Link>

                {/* Nivel 1: categorías principales */}
                <ul className="desktop-dropdown">
                  {level1Cats.map(cat => {
                    const subs = childMap.get(cat.id) ?? [];
                    const hasSubs = subs.length > 0;
                    return (
                      <li key={cat.id} className={`desktop-dropdown-item${hasSubs ? ' has-submenu' : ''}`}>
                        <Link to={`/products?category=${cat.name}`} className="desktop-dropdown-link">
                          {cat.name}
                          {hasSubs && <FiChevronRight className="submenu-arrow" />}
                        </Link>

                        {/* Nivel 2: subcategorías */}
                        {hasSubs && (
                          <ul className="desktop-subdropdown">
                            {subs.map(sub => {
                              const subChildren = childMap.get(sub.id) ?? [];
                              const hasChildren = subChildren.length > 0;
                              return (
                                <li key={sub.id} className={`desktop-dropdown-item${hasChildren ? ' has-submenu' : ''}`}>
                                  <Link
                                    to={`/products?category=${cat.name}&subcategory=${sub.name}`}
                                    className="desktop-dropdown-link"
                                  >
                                    {sub.name}
                                    {hasChildren && <FiChevronRight className="submenu-arrow" />}
                                  </Link>

                                  {/* Nivel 3: sub-subcategorías */}
                                  {hasChildren && (
                                    <ul className="desktop-subdropdown">
                                      {subChildren.map(child => (
                                        <li key={child.id} className="desktop-dropdown-item">
                                          <Link
                                            to={`/products?category=${cat.name}&subcategory=${sub.name}&subsubcategory=${child.name}`}
                                            className="desktop-dropdown-link"
                                          >
                                            {child.name}
                                          </Link>
                                        </li>
                                      ))}
                                    </ul>
                                  )}
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </li>
            )}

            {staticNavAfter.map(item => (
              <li key={item.name} className="desktop-nav-item">
                <Link to={item.path} className="desktop-nav-link">{item.name}</Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Mobile Overlay */}
        <div
          className={`mobile-overlay ${mobileMenuOpen ? 'active' : ''}`}
          onClick={closeMenu}
        />

        {/* Menú Principal Deslizable — 3 paneles */}
        <div className={`nav-menu-slider ${mobileMenuOpen ? 'active' : ''}`}>

          {/* Panel 0: Menú Principal */}
          <div className={`nav-menu-level level-main ${mobileLevel > 0 ? 'slide-out' : ''}`}>
            <div className="nav-menu-header">
              <span className="nav-menu-title">Menú</span>
              <button className="nav-menu-close" onClick={closeMenu}><FiX /></button>
            </div>

            {currentUser && (
              <div style={{ padding: '0', borderBottom: '1px solid rgba(184,165,200,0.2)' }}>
                <div style={{ padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FiUser size={20} />
                    <span style={{ fontWeight: 500 }}>{currentUser.name}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', color: '#c0392b', display: 'flex', alignItems: 'center' }}
                    title="Cerrar sesión"
                  >
                    <FiLogOut size={18} />
                  </button>
                </div>
                <button
                  onClick={handleMobileChangePassword}
                  style={{ width: '100%', padding: '0.9rem 1rem', background: 'none', border: 'none', borderTop: '1px solid rgba(184,165,200,0.15)', cursor: 'pointer', color: 'var(--text-dark)', fontSize: '0.95rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.75rem', transition: 'background-color var(--transition-fast)', textAlign: 'left' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--primary-bg)'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  title="Cambiar contraseña"
                >
                  <FiLock size={18} />
                  <span>Cambiar contraseña</span>
                </button>
              </div>
            )}

            <ul className="nav-menu-list">
              {staticNavBefore.map(item => (
                <li key={item.name} className="nav-menu-item">
                  <Link to={item.path} className="nav-link" onClick={closeMenu}>{item.name}</Link>
                </li>
              ))}
              {level1Cats.map(cat => {
                const hasSubs = (childMap.get(cat.id) ?? []).length > 0;
                return (
                  <li key={cat.id} className="nav-menu-item">
                    {hasSubs ? (
                      <button className="nav-link-btn" onClick={() => setMobileL1(cat)}>
                        {cat.name}
                        <FiChevronRight className="nav-link-arrow" />
                      </button>
                    ) : (
                      <Link to={`/products?category=${cat.name}`} className="nav-link" onClick={closeMenu}>
                        {cat.name}
                      </Link>
                    )}
                  </li>
                );
              })}
              {staticNavAfter.map(item => (
                <li key={item.name} className="nav-menu-item">
                  <Link to={item.path} className="nav-link" onClick={closeMenu}>{item.name}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Panel 1: Subcategorías del nivel 1 seleccionado */}
          <div className={`nav-menu-level level-sub ${mobileLevel === 1 ? 'slide-in' : mobileLevel > 1 ? 'slide-out' : ''}`}>
            <div className="nav-menu-header">
              <button className="nav-menu-back" onClick={() => setMobileL1(null)}><FiArrowLeft /></button>
              <span className="nav-menu-title">{mobileL1?.name.toUpperCase()}</span>
              <button className="nav-menu-close" onClick={closeMenu}><FiX /></button>
            </div>
            <ul className="nav-menu-list">
              {mobileL1 && (
                <li className="nav-menu-item">
                  <Link
                    to={`/products?category=${mobileL1.name}`}
                    className="nav-link view-all-link"
                    onClick={closeMenu}
                  >
                    Ver todo en {mobileL1.name}
                  </Link>
                </li>
              )}
              {(mobileL1 ? childMap.get(mobileL1.id) ?? [] : []).map(sub => {
                const hasChildren = (childMap.get(sub.id) ?? []).length > 0;
                return (
                  <li key={sub.id} className="nav-menu-item">
                    {hasChildren ? (
                      <button className="nav-link-btn" onClick={() => setMobileL2(sub)}>
                        {sub.name}
                        <FiChevronRight className="nav-link-arrow" />
                      </button>
                    ) : (
                      <Link
                        to={`/products?category=${mobileL1!.name}&subcategory=${sub.name}`}
                        className="nav-link"
                        onClick={closeMenu}
                      >
                        {sub.name}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Panel 2: Sub-subcategorías del nivel 2 seleccionado */}
          <div className={`nav-menu-level level-sub ${mobileLevel === 2 ? 'slide-in' : ''}`}>
            <div className="nav-menu-header">
              <button className="nav-menu-back" onClick={() => setMobileL2(null)}><FiArrowLeft /></button>
              <span className="nav-menu-title">{mobileL2?.name.toUpperCase()}</span>
              <button className="nav-menu-close" onClick={closeMenu}><FiX /></button>
            </div>
            <ul className="nav-menu-list">
              {mobileL2 && (
                <li className="nav-menu-item">
                  <Link
                    to={`/products?category=${mobileL1!.name}&subcategory=${mobileL2.name}`}
                    className="nav-link view-all-link"
                    onClick={closeMenu}
                  >
                    Ver todo en {mobileL2.name}
                  </Link>
                </li>
              )}
              {(mobileL2 ? childMap.get(mobileL2.id) ?? [] : []).map(child => (
                <li key={child.id} className="nav-menu-item">
                  <Link
                    to={`/products?category=${mobileL1!.name}&subcategory=${mobileL2!.name}&subsubcategory=${child.name}`}
                    className="nav-link"
                    onClick={closeMenu}
                  >
                    {child.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right Side Icons */}
        <div className="navbar-right">
          <div className="search-container">
            <button className="icon-btn" onClick={() => setSearchOpen(!searchOpen)}>
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
          {currentUser ? (
            <UserProfileDropdown user={currentUser} onLogout={handleLogout} />
          ) : (
            <>
              <button className="login-btn hide-mobile" onClick={() => setIsAuthModalOpen(true)}>
                Iniciar sesion
              </button>
              <button className="icon-btn hide-desktop" onClick={() => setIsAuthModalOpen(true)}>
                <FiUser className="icon" />
              </button>
            </>
          )}
          <button className={`icon-btn cart-badge-wrapper${cartBump ? ' cart-bump' : ''}`} onClick={() => setIsCartOpen(true)}>
            <FiShoppingCart className="icon" />
            {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
          </button>
        </div>
      </div>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      <ChangePasswordModal isOpen={isMobilePasswordModalOpen} onClose={() => setIsMobilePasswordModalOpen(false)} />
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </nav>
  );
};

export default NavBar;
