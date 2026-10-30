import { useState, useEffect } from 'react';
import { ShoppingBag, Filter } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import ProductCard from '../components/ProductCard';

export default function GenderPage({ gender, title }) {
  const { products, addToCart, loading } = useStore();
  const [selectedCategory, setSelectedCategory] = useState('Tümü');
  const [currentSlide, setCurrentSlide] = useState(0);

  const genderProducts = products.filter((product) => {
    const matchesGender =
      product.gender === gender || product.gender === 'Unisex';
    const totalStock = Object.values(product.inventory || {}).reduce(
      (sum, qty) => sum + qty,
      0
    );
    return matchesGender && totalStock > 0;
  });

  const filteredProducts =
    selectedCategory === 'Tümü'
      ? genderProducts
      : genderProducts.filter((p) => p.category === selectedCategory);

  const featuredProducts = genderProducts.slice(0, 5);

  useEffect(() => {
    if (featuredProducts.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) =>
        prev === featuredProducts.length - 1 ? 0 : prev + 1
      );
    }, 4000);
    return () => clearInterval(interval);
  }, [featuredProducts.length]);

  const categories = ['Tümü', 'Elbise', 'Tişört', 'Pantolon', 'Takım', 'Aksesuar'];

  return (
    <div>
      {featuredProducts.length > 0 && (
        <div className="hero-slider">
          {featuredProducts.map((product, index) => (
            <div
              key={product.id}
              className={`hero-slide ${index === currentSlide ? 'active' : 'inactive'}`}
            >
              <div className="hero-content">
                <span className="badge badge-pink mb-4 w-max">
                  {product.category}
                </span>
                <h2 className="text-3xl md:text-5xl font-black text-primary-blue mb-4 line-clamp-2">
                  {product.title}
                </h2>
                <p className="text-xl font-bold text-text-main mb-6">
                  {product.price} ₺
                </p>
                <button
                  onClick={() =>
                    addToCart(product, Object.keys(product.inventory || {})[0])
                  }
                  className="btn btn-primary w-max"
                  disabled={!Object.keys(product.inventory || {}).length}
                >
                  <ShoppingBag size={20} className="mr-2" /> Hızlı Ekle
                </button>
              </div>

              <div className="hero-image-container">
                <div className="hero-gradient" />
                <img
                  src={
                    product.images && product.images.length > 0
                      ? product.images[0]
                      : product.imageUrl
                  }
                  alt={product.title}
                  className="hero-image"
                />
              </div>
            </div>
          ))}

          <div className="slider-dots">
            {featuredProducts.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`slider-dot ${idx === currentSlide ? 'active' : ''}`}
              />
            ))}
          </div>
        </div>
      )}

      <div className="shop-section">
        <aside className="sidebar">
          <div className="sidebar-sticky">
            <h3 className="sidebar-title">
              <Filter size={16} strokeWidth={2} />
              Kategoriler
            </h3>
            <ul className="category-list">
              {categories.map((category) => (
                <li key={category} className="category-item">
                  <button
                    onClick={() => setSelectedCategory(category)}
                    className={`category-btn ${
                      selectedCategory === category ? 'active' : ''
                    }`}
                  >
                    {category}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <div className="product-area">
          <div className="product-header">
            <h2>
              {title} {selectedCategory !== 'Tümü' && `- ${selectedCategory}`}
            </h2>
            <span className="product-count">{filteredProducts.length} Ürün</span>
          </div>

          {loading ? (
            <div className="loading-state">
              <div className="spinner" />
              <p>Koleksiyon hazırlanıyor...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="empty-state">Bu kategoride ürün bulunamadı.</div>
          ) : (
            <div className="product-grid">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  addToCart={addToCart}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
