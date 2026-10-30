import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingBag } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import ProductCard from '../components/ProductCard';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { products, addToCart, loading } = useStore();

  const product = products.find((p) => p.id === id);
  const [selectedAge, setSelectedAge] = useState('');
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isZooming, setIsZooming] = useState(false);
  const [zoomStyle, setZoomStyle] = useState({});

  useEffect(() => {
    if (product) {
      const ages = Object.entries(product.inventory || {})
        .filter(([, count]) => count > 0)
        .map(([age]) => age);
      if (ages.length > 0) {
        setSelectedAge(ages[0]);
      }
    }
  }, [product]);

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '5rem 0'
        }}
      >
        <div className="spinner" style={{ marginBottom: '1rem' }} />
        <p
          style={{
            fontSize: '1.25rem',
            fontWeight: 'bold',
            color: 'var(--color-gray)'
          }}
        >
          Ürün Yükleniyor...
        </p>
      </div>
    );
  }

  if (!product) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem 0' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '1rem' }}>
          Ürün Bulunamadı
        </h2>
        <p style={{ color: 'var(--color-gray)', marginBottom: '2rem' }}>
          Aradığınız ürün yayından kaldırılmış veya taşınmış olabilir.
        </p>
        <button onClick={() => navigate('/')} className="btn btn-primary">
          Ana Sayfaya Dön
        </button>
      </div>
    );
  }

  const availableAges = Object.entries(product.inventory || {})
    .filter(([, count]) => count > 0)
    .map(([age]) => age);

  const similarProducts = products
    .filter(
      (item) =>
        item.id !== product.id &&
        item.category === product.category &&
        (item.gender === product.gender || item.gender === 'Unisex')
    )
    .slice(0, 5);

  const currentImage =
    product.images && product.images.length > 0
      ? product.images[activeImageIndex]
      : product.imageUrl;

  const handleMouseMove = (e) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const xPercent = ((e.pageX - left) / width) * 100;
    const yPercent = ((e.pageY - top) / height) * 100;

    setZoomStyle({
      backgroundImage: `url(${currentImage})`,
      backgroundPosition: `${xPercent}% ${yPercent}%`,
      backgroundSize: '250%',
      opacity: 1
    });
  };

  return (
    <div className="product-detail-container">
      <button onClick={() => navigate(-1)} className="product-detail-back">
        <ArrowLeft size={20} />
        Geri Dön
      </button>

      <div
        className="card"
        style={{
          borderRadius: '1.5rem',
          padding: '2rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid var(--color-border)',
          marginBottom: '4rem'
        }}
      >
        <div className="product-detail-grid">
          <div>
            <div
              className="product-detail-image-wrapper"
              style={{
                position: 'relative',
                cursor: 'crosshair',
                marginBottom: '1rem'
              }}
              onMouseEnter={() => setIsZooming(true)}
              onMouseMove={handleMouseMove}
              onMouseLeave={() => {
                setZoomStyle({ opacity: 0 });
                setTimeout(() => setIsZooming(false), 200);
              }}
            >
              <img
                src={currentImage}
                alt={product.title}
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/800?text=Görsel+Yok';
                }}
              />
              {isZooming && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    pointerEvents: 'none',
                    transition: 'opacity 0.2s',
                    backgroundColor: 'white',
                    ...zoomStyle
                  }}
                />
              )}
            </div>

            {product.images && product.images.length > 1 && (
              <div
                style={{
                  display: 'flex',
                  gap: '0.75rem',
                  overflowX: 'auto',
                  paddingBottom: '0.5rem'
                }}
              >
                {product.images.map((imgUrl, idx) => (
                  <div
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    style={{
                      width: '80px',
                      height: '100px',
                      borderRadius: '0.5rem',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      border:
                        activeImageIndex === idx
                          ? '2px solid var(--color-primary)'
                          : '2px solid transparent',
                      transition: 'border-color 0.2s ease',
                      flexShrink: 0
                    }}
                  >
                    <img
                      src={imgUrl}
                      alt={`Görsel ${idx + 1}`}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="product-detail-info">
            <div className="product-detail-meta">
              <span className="badge badge-pink">{product.category}</span>
              <span
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 'bold',
                  color: 'var(--color-primary)',
                  backgroundColor: 'var(--color-light-gray)',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '9999px'
                }}
              >
                {product.gender || 'Unisex'}
              </span>
            </div>

            <h1 className="product-detail-title">{product.title}</h1>

            <div className="product-detail-price">{product.price} ₺</div>

            <div style={{ marginBottom: '2rem' }}>
              <label
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 900,
                  marginBottom: '1rem',
                  display: 'block',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}
              >
                Yaş Seçimi
              </label>

              {availableAges.length === 0 ? (
                <div
                  style={{
                    color: 'red',
                    fontWeight: 'bold',
                    backgroundColor: 'rgba(255,0,0,0.1)',
                    padding: '1rem',
                    borderRadius: '0.75rem'
                  }}
                >
                  Stok Tükendi
                </div>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                  {availableAges.map((age) => (
                    <button
                      key={age}
                      onClick={() => setSelectedAge(age)}
                      style={{
                        padding: '0.75rem 1rem',
                        border: '2px solid',
                        borderColor:
                          selectedAge === age
                            ? 'var(--color-primary)'
                            : 'var(--color-border)',
                        backgroundColor:
                          selectedAge === age
                            ? 'var(--color-primary)'
                            : 'transparent',
                        color:
                          selectedAge === age ? 'white' : 'var(--color-text)',
                        borderRadius: '0.75rem',
                        fontWeight: 'bold',
                        transition: 'all 0.2s ease',
                        cursor: 'pointer'
                      }}
                    >
                      {age}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => addToCart(product, selectedAge)}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '1rem',
                fontSize: '1.125rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem'
              }}
              disabled={!selectedAge}
            >
              <ShoppingBag size={24} />
              {selectedAge ? 'Sepete Ekle' : 'Lütfen Yaş Seçin'}
            </button>
          </div>
        </div>
      </div>

      {similarProducts.length > 0 && (
        <div style={{ marginBottom: '4rem' }}>
          <h3 style={{ fontSize: '1.75rem', fontWeight: 900, marginBottom: '2rem' }}>
            Benzer Ürünler
          </h3>
          <div className="product-grid">
            {similarProducts.map((similar) => (
              <ProductCard
                key={similar.id}
                product={similar}
                addToCart={addToCart}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
