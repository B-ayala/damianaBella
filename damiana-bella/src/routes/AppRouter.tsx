<<<<<<< HEAD
import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
=======
import { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import UserLayout from '../users/layout/UserLayout';
import EmailConfirmation from '../users/pages/auth/EmailConfirmation';
>>>>>>> dbfe84bfd5fd63ece459443b614fa97480384591
import ScrollToTop from '../components/common/ScrollToTop';
import { InitialRouteReady } from '../components/common/InitialLoad/InitialLoadProvider';
import { NavigationLoadProvider } from '../components/common/NavigationLoad/NavigationLoadProvider';

<<<<<<< HEAD
// Layouts y guards quedan EAGER: son wrappers que siempre se renderizan; lazy
// loadearlos introduce un flash innecesario al entrar a cualquier ruta.
import UserLayout from '../users/layout/UserLayout';
import AdminProtectedRoute from '../admin/routes/AdminProtectedRoute';
import AdminLayout from '../admin/layout/AdminLayout';
=======
const Home = lazy(() => import('../users/pages/home/Home'));
const Products = lazy(() => import('../users/pages/products/Products'));
const Contact = lazy(() => import('../users/pages/contact/Contact'));
const About = lazy(() => import('../users/pages/about/About'));
const ProductDetail = lazy(() => import('../users/pages/producDetail/ProductDetail'));
const Checkout = lazy(() => import('../users/pages/checkout/Checkout'));
const CheckoutResult = lazy(() => import('../users/pages/checkout/CheckoutResult'));
const ResetPassword = lazy(() => import('../users/pages/auth/ResetPassword'));
const AdminProtectedRoute = lazy(() => import('../admin/routes/AdminProtectedRoute'));
const AdminLayout = lazy(() => import('../admin/layout/AdminLayout'));
const HomeManager = lazy(() => import('../admin/pages/HomeManager/HomeManager'));
const AdminProducts = lazy(() => import('../admin/pages/Products/Products'));
const AdminUsers = lazy(() => import('../admin/pages/Users/Users'));
const AboutEditor = lazy(() => import('../admin/pages/AboutEditor/AboutEditor'));
const FooterEditor = lazy(() => import('../admin/pages/FooterEditor/FooterEditor'));
const CloudinaryManager = lazy(() => import('../admin/pages/CloudinaryManager/CloudinaryManager'));
const AdminSales = lazy(() => import('../admin/pages/Sales/Sales'));
const AdminDispatches = lazy(() => import('../admin/pages/Dispatches/Dispatches'));
>>>>>>> dbfe84bfd5fd63ece459443b614fa97480384591

// Páginas hoja: lazy. Esto permite que el bundle público no arrastre el
// código admin (y viceversa). El chunk de cada página se carga cuando se
// navega a ella.
const Home = lazy(() => import('../users/pages/home/Home'));
const Products = lazy(() => import('../users/pages/products/Products'));
const ProductDetail = lazy(() => import('../users/pages/producDetail/ProductDetail'));
const Checkout = lazy(() => import('../users/pages/checkout/Checkout'));
const Contact = lazy(() => import('../users/pages/contact/Contact'));
const About = lazy(() => import('../users/pages/about/About'));
const EmailConfirmation = lazy(() => import('../users/pages/auth/EmailConfirmation'));

const HomeManager = lazy(() => import('../admin/pages/HomeManager/HomeManager'));
const AdminProducts = lazy(() => import('../admin/pages/Products/Products'));
const AdminUsers = lazy(() => import('../admin/pages/Users/Users'));
const AboutEditor = lazy(() => import('../admin/pages/AboutEditor/AboutEditor'));
const FooterEditor = lazy(() => import('../admin/pages/FooterEditor/FooterEditor'));
const CloudinaryManager = lazy(() => import('../admin/pages/CloudinaryManager/CloudinaryManager'));
const ThemesManager = lazy(() => import('../admin/pages/ThemesManager/ThemesManager'));

// Fallback estable: min-height evita colapso del layout, colores derivados de
// las variables del sistema (no introduce paleta nueva). Se ve discreto, no
// compite con la marca.
const RouteFallback = () => (
  <div
    role="status"
    aria-live="polite"
    style={{
      minHeight: '60vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: '0.75rem',
      color: 'var(--text-light)',
      fontSize: '0.9rem',
    }}
  >
    <span
      aria-hidden="true"
      style={{
        width: 36,
        height: 36,
        borderRadius: '50%',
        border: '3px solid rgba(184,165,200,0.2)',
        borderTopColor: 'var(--primary-color)',
        animation: 'appRouterSpin 0.8s linear infinite',
      }}
    />
    <span>Cargando…</span>
    <style>{`@keyframes appRouterSpin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

const AppRouter = () => {
  return (
    <NavigationLoadProvider>
      <ScrollToTop />
<<<<<<< HEAD
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          {/* Auth Routes */}
          <Route path="/auth/confirm" element={<EmailConfirmation />} />

          {/* Admin Routes */}
          <Route element={<AdminProtectedRoute />}>
            <Route path="/admin" element={<AdminLayout />}>
=======
      <Suspense fallback={null}>
        <Routes>
          {/* Auth Routes */}
          <Route path="/auth/confirm" element={<EmailConfirmation />} />
          <Route path="/auth/reset-password" element={<ResetPassword />} />

          {/* Admin Routes */}
          <Route element={<AdminProtectedRoute />}>
            <Route path="/admin" element={<InitialRouteReady><AdminLayout /></InitialRouteReady>}>
>>>>>>> dbfe84bfd5fd63ece459443b614fa97480384591
              <Route index element={<HomeManager />} />
              <Route path="home" element={<HomeManager />} />
              <Route path="products" element={<AdminProducts />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="about" element={<AboutEditor />} />
              <Route path="site-config" element={<FooterEditor />} />
              <Route path="cloudinary" element={<CloudinaryManager />} />
<<<<<<< HEAD
              <Route path="themes" element={<ThemesManager />} />
=======
              <Route path="sales" element={<AdminSales />} />
              <Route path="dispatches" element={<AdminDispatches />} />
>>>>>>> dbfe84bfd5fd63ece459443b614fa97480384591
            </Route>
          </Route>

          {/* Public Routes */}
          <Route element={<UserLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<Products />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/checkout" element={<Checkout />} />
<<<<<<< HEAD
            <Route path="/contact" element={<Contact />} />
=======
            <Route path="/checkout/result" element={<InitialRouteReady><CheckoutResult /></InitialRouteReady>} />
            <Route path="/contact" element={<InitialRouteReady><Contact /></InitialRouteReady>} />
>>>>>>> dbfe84bfd5fd63ece459443b614fa97480384591
            <Route path="/about" element={<About />} />
          </Route>
        </Routes>
      </Suspense>
<<<<<<< HEAD
    </>
=======
    </NavigationLoadProvider>
>>>>>>> dbfe84bfd5fd63ece459443b614fa97480384591
  );
};

export default AppRouter;
