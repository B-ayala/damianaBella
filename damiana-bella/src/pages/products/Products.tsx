import './Products.css';
import ProductGrid from '../../components/ProductGrid/ProductGrid';
import { sampleProducts } from '../../data/products';

const Products = () => {
  return (
    <div className="products-page">
      <div className="products-container">
        <h1>Nuestros Productos</h1>
        <ProductGrid products={sampleProducts} />
      </div>
    </div>
  );
};

export default Products;
