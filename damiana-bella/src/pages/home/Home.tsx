import Carousel from '../../components/header/Carousel';
import ProductGrid from '../../components/ProductGrid/ProductGrid';
import { sampleProducts } from '../../data/products';
import './Home.css';

const Home = () => {
  return (
    <div className="home">
      <Carousel />
      
      <section className="home__featured-products">
        <div className="home__container">
          <h2 className="home__section-title">Productos Destacados</h2>
          <ProductGrid 
            products={sampleProducts} 
            limit={10}
          />
        </div>
      </section>
    </div>
  );
};

export default Home;
