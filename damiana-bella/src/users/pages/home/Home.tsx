import { useEffect, useState } from 'react';
import Carousel from '../../components/header/Carousel';
import ProductGrid from '../../components/ProductGrid/ProductGrid';
import { fetchProducts, mapDbRowToProduct } from '../../../services/productService';
import type { Product } from '../../../types/product';
import './Home.css';

const Home = () => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    fetchProducts()
      .then((rows) => setProducts(rows.map(mapDbRowToProduct)))
      .catch(console.error);
  }, []);

  return (
    <div className="home">
      <Carousel />

      <section className="home__featured-products">
        <div className="home__container">
          <h2 className="home__section-title">Productos Destacados</h2>
          <ProductGrid
            products={products}
            limit={10}
          />
        </div>
      </section>
    </div>
  );
};

export default Home;
