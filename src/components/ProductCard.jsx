import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';

export default function ProductCard({ product, addToCart }) {
  const availableAges = Object.entries(product.inventory || {})
    .filter(([, count]) => count > 0)
    .map(([age]) => age);

  const [selectedAge, setSelectedAge] = useState(availableAges[0] || '');

  return (
    <div className="product-card card border-none shadow-none hover:shadow-none bg-transparent">
      <div className="product-image-container">
        <Link
          to={`/product/${product.id}`}
          style={{ display: 'block', width: '100%', height: '100%' }}
        >
          <span
            className="badge badge-pink product-badge z-10"
            style={{ position: 'absolute', top: '10px', left: '10px' }}
          >
            {product.category}
          </span>
          <img
            src={
              product.images && product.images.length > 0
                ? product.images[0]
                : product.imageUrl
            }
            alt={product.title}
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/400?text=Görsel+Yok';
            }}
          />
        </Link>

        <div className="product-overlay">
          <div style={{ width: '100%', marginBottom: '1rem' }}>
            <label
              style={{
                fontSize: '0.75rem',
                fontWeight: 900,
                marginBottom: '0.5rem',
                display: 'block',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                textAlign: 'center'
              }}
            >
              Yaş Seçimi
            </label>
            <div className="age-buttons-grid">
              {availableAges.map((age) => (
                <button
                  key={age}
                  onClick={(e) => {
                    e.preventDefault();
                    setSelectedAge(age);
                  }}
                  className={`age-button ${selectedAge === age ? 'selected' : ''}`}
                >
                  {age}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => addToCart(product, selectedAge)}
            className="btn btn-primary"
            style={{
              width: '100%',
              padding: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
            disabled={!selectedAge}
          >
            <ShoppingBag size={18} />
            Sepete Ekle
          </button>
        </div>
      </div>

      <div
        style={{
          padding: '0.25rem',
          display: 'flex',
          flexDirection: 'column',
          flexGrow: 1,
          textAlign: 'center'
        }}
      >
        <Link to={`/product/${product.id}`} style={{ textDecoration: 'none' }}>
          <h3
            style={{
              fontWeight: 'bold',
              fontSize: '1rem',
              marginBottom: '0.25rem',
              color: 'var(--color-text)'
            }}
          >
            {product.title}
          </h3>
        </Link>
        <span
          style={{
            fontSize: '1.25rem',
            fontWeight: 900,
            color: 'var(--color-text)',
            marginTop: 'auto'
          }}
        >
          {product.price} ₺
        </span>
      </div>
    </div>
  );
}
