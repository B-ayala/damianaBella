import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import './Products.css';
import ProductGrid from '../../components/ProductGrid/ProductGrid';
import { fetchProducts, mapDbRowToProduct } from '../../../services/productService';
import type { Product } from '../../../types/product';

const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();

  const activeCategory = searchParams.get('subcategory') || 'Todos';

  useEffect(() => {
    fetchProducts()
      .then((rows) => setProducts(rows.map(mapDbRowToProduct)))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() => {
    const cats = Array.from(
      new Set(products.map((p) => p.category).filter(Boolean))
    ) as string[];
    return ['Todos', ...cats.sort()];
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (activeCategory === 'Todos') return products;
    return products.filter((p) => p.category === activeCategory);
  }, [products, activeCategory]);

  const handleCategoryClick = (cat: string) => {
    if (cat === 'Todos') {
      setSearchParams({});
    } else {
      setSearchParams({ subcategory: cat });
    }
  };

  return (
    <div className="products-page">
      <div className="products-container">
        <h1>Nuestros Productos</h1>

        {!loading && categories.length > 1 && (
          <div className="products-filters">
            {categories.map((cat) => (
              <button
                key={cat}
                className={`products-filter-btn${activeCategory === cat ? ' active' : ''}`}
                onClick={() => handleCategoryClick(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <p className="products-loading">Cargando productos...</p>
        ) : filteredProducts.length === 0 ? (
          <p className="products-empty">No hay productos en esta categoría.</p>
        ) : (
          <ProductGrid products={filteredProducts} />
        )}
      </div>
    </div>
  );
};

export default Products;
