import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './protectRouter';
import Home from '../pages/home/Home';
import Products from '../pages/products/Products';
import Contact from '../pages/contact/Contact';
import About from '../pages/about/About';
import ProductDetail from '../pages/producDetail/ProductDetail';
import Checkout from '../pages/checkout/Checkout';
import ScrollToTop from '../components/common/ScrollToTop';

// Admin imports
import AdminProtectedRoute from '../admin/routes/AdminProtectedRoute';
import AdminLayout from '../admin/layout/AdminLayout';
import AdminDashboard from '../admin/pages/Dashboard/Dashboard';
import HomeManager from '../admin/pages/HomeManager/HomeManager';
import AdminProducts from '../admin/pages/Products/Products';
import AdminUsers from '../admin/pages/Users/Users';
import AboutEditor from '../admin/pages/AboutEditor/AboutEditor';
import FooterEditor from '../admin/pages/FooterEditor/FooterEditor';


const AppRouter = () => {
  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* Admin Routes */}
        <Route element={<AdminProtectedRoute />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="home" element={<HomeManager />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="about" element={<AboutEditor />} />
            <Route path="site-config" element={<FooterEditor />} />
          </Route>
        </Route>

        {/* Public Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/about" element={<About />} />
        </Route>
      </Routes>
    </>
  );
};

export default AppRouter;
