import { useEffect, useState } from 'react';
import Carousel from '../../components/header/Carousel';
import ProductGrid from '../../components/ProductGrid/ProductGrid';
import { fetchFeaturedProducts, mapDbRowToProduct } from '../../../services/productService';
import type { Product } from '../../../types/product';
import { useInitialLoadTask } from '../../../components/common/InitialLoad/InitialLoadProvider';
import './Home.css';

const Home = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isFeaturedLoading, setIsFeaturedLoading] = useState(true);
  const [isCarouselReady, setIsCarouselReady] = useState(false);

  useInitialLoadTask('route', isFeaturedLoading || !isCarouselReady);

  useEffect(() => {
    fetchFeaturedProducts()
      .then((rows) => setProducts(rows.map(mapDbRowToProduct)))
      .catch(console.error)
      .finally(() => setIsFeaturedLoading(false));
  }, []);

  return (
    <div className="home">
      <Carousel onReady={() => setIsCarouselReady(true)} />

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
