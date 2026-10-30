import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ArrowRight } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export default function Cart() {
  const { cart, removeFromCart } = useStore();
  const navigate = useNavigate();

  const subtotal = cart.reduce(
    (sum, item) => sum + Number(item.price) * (item.quantity || 1),
    0
  );

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-black mb-8 text-text-main">
        Alışveriş Sepetim
      </h1>

      {cart.length === 0 ? (
        <div className="card rounded-3xl p-12 text-center shadow-sm">
          <div
            className="bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ width: '6rem', height: '6rem' }}
          >
            <span className="text-4xl">🛒</span>
          </div>
          <h2 className="text-2xl font-bold mb-4">Sepetiniz şu an boş.</h2>
          <p className="text-muted mb-8">
            Mağazamızdaki harika ürünleri keşfetmeye ne dersiniz?
          </p>
          <Link to="/" className="btn btn-primary px-8 py-3 text-lg">
            Alışverişe Başla
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 flex flex-col gap-4">
            {cart.map((item) => (
              <div
                key={item.cartId}
                className="card p-4 rounded-2xl shadow-sm flex items-center gap-4"
              >
                <img
                  src={
                    item.images && item.images.length > 0
                      ? item.images[0]
                      : item.imageUrl
                  }
                  alt={item.title}
                  className="w-24 h-24 object-cover rounded-xl"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/100?text=Görsel';
                  }}
                />

                <div className="flex-1">
                  <h3 className="font-bold text-lg">{item.title}</h3>
                  <p className="text-sm text-muted mb-1">
                    Seçilen Yaş: {item.selectedAge}
                  </p>
                  <p className="font-black text-primary-pink text-lg">
                    {item.price} ₺
                  </p>
                </div>

                <button
                  onClick={() => removeFromCart(item.cartId)}
                  className="p-3 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                  title="Sepetten Çıkar"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            ))}
          </div>

          <div className="card p-6 rounded-3xl shadow-sm h-fit">
            <h2 className="text-xl font-bold mb-6 text-text-main">
              Sipariş Özeti
            </h2>

            <div className="flex justify-between mb-4 text-muted">
              <span>Ara Toplam</span>
              <span>{subtotal} ₺</span>
            </div>

            <div className="flex justify-between mb-6 text-muted">
              <span>Kargo</span>
              <span className="text-accent-green font-bold">Ücretsiz</span>
            </div>

            <div className="flex justify-between items-center mb-8 pt-4 border-t border-border-color">
              <span className="font-bold text-lg">Genel Toplam</span>
              <span className="font-black text-2xl text-primary-pink">
                {subtotal} ₺
              </span>
            </div>

            <button
              onClick={() => navigate('/checkout')}
              className="btn btn-primary w-full text-lg py-3 flex items-center justify-center gap-2"
            >
              Siparişi Tamamla <ArrowRight size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
