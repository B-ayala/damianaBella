import { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import UserLayout from '../users/layout/UserLayout';
import EmailConfirmation from '../users/pages/auth/EmailConfirmation';
import ScrollToTop from '../components/common/ScrollToTop';
import { InitialRouteReady } from '../components/common/InitialLoad/InitialLoadProvider';
import { NavigationLoadProvider } from '../components/common/NavigationLoad/NavigationLoadProvider';

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


const AppRouter = () => {
  return (
    <NavigationLoadProvider>
      <ScrollToTop />
      <Suspense fallback={null}>
        <Routes>
          {/* Auth Routes */}
          <Route path="/auth/confirm" element={<EmailConfirmation />} />
          <Route path="/auth/reset-password" element={<ResetPassword />} />

          {/* Admin Routes */}
          <Route element={<AdminProtectedRoute />}>
            <Route path="/admin" element={<InitialRouteReady><AdminLayout /></InitialRouteReady>}>
              <Route index element={<HomeManager />} />
              <Route path="home" element={<HomeManager />} />
              <Route path="products" element={<AdminProducts />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="about" element={<AboutEditor />} />
              <Route path="site-config" element={<FooterEditor />} />
              <Route path="cloudinary" element={<CloudinaryManager />} />
              <Route path="sales" element={<AdminSales />} />
              <Route path="dispatches" element={<AdminDispatches />} />
            </Route>
          </Route>

          {/* Public Routes */}
          <Route element={<UserLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<Products />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/checkout/result" element={<InitialRouteReady><CheckoutResult /></InitialRouteReady>} />
            <Route path="/contact" element={<InitialRouteReady><Contact /></InitialRouteReady>} />
            <Route path="/about" element={<About />} />
          </Route>
        </Routes>
      </Suspense>
    </NavigationLoadProvider>
  );
};

export default AppRouter;
