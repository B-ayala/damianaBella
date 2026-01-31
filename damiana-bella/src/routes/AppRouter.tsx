import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './protectRouter';
import Home from '../pages/home/Home';
import Products from '../pages/products/Products';
import Contact from '../pages/contact/Contact';
import ProductDetail from '../pages/producDetail/ProductDetail';


const AppRouter = () => {
  return (
    <Routes>
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<Products />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/about" element={<Contact />} />
      </Route>
    </Routes>
  );
};

export default AppRouter;
