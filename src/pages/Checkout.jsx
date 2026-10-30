import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Smartphone } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export default function Checkout() {
  const { cart, placeOrder, clearCart, user } = useStore();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user?.displayName || '',
    phone: '',
    city: '',
    address: ''
  });

  const totalAmount = cart.reduce(
    (sum, item) => sum + Number(item.price) * (item.quantity || 1),
    0
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cart.length === 0) {
      alert('Sepetiniz boş!');
      return;
    }

    setSubmitting(true);
    try {
      const orderId = await placeOrder(formData);
      let message = `*YENİ SİPARİŞ - #${orderId.substring(0, 6).toUpperCase()}*\n\n`;
      message += `👤 *Müşteri:* ${formData.fullName}\n`;
      message += `📞 *Telefon:* ${formData.phone}\n`;
      message += `📍 *Şehir:* ${formData.city}\n`;
      message += `🏠 *Adres:* ${formData.address}\n\n`;
      message += `🛍️ *SİPARİŞ DETAYI:*\n`;

      cart.forEach((item) => {
        const qty = item.quantity || 1;
        message += `- ${item.title} (Yaş: ${item.selectedAge}) x ${qty} = ${
          item.price * qty
        } ₺\n`;
      });

      message += `\n💰 *TOPLAM TUTAR:* ${totalAmount} ₺`;

      const whatsappUrl = `https://wa.me/905057120506?text=${encodeURIComponent(
        message
      )}`;

      clearCart();
      window.open(whatsappUrl, '_blank');
      navigate('/');
    } catch {
      alert('Sipariş oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.');
      setSubmitting(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (cart.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-center">
        <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 size={48} className="text-slate-300" />
        </div>
        <h2 className="text-3xl font-black mb-4">Sepetiniz Boş</h2>
        <button onClick={() => navigate('/')} className="btn btn-primary">
          Alışverişe Başla
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-text-muted hover:text-primary-pink font-bold mb-8 transition-colors"
      >
        <ArrowLeft size={20} />
        Geri Dön
      </button>

      <h1 className="text-3xl font-black mb-8">Siparişi Tamamla</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div>
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-primary-pink text-white flex items-center justify-center text-sm">
              1
            </span>
            Teslimat Bilgileri
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Ad Soyad</label>
              <input
                type="text"
                name="fullName"
                required
                value={formData.fullName}
                onChange={handleChange}
                className="input-field"
                placeholder="İsim Soyisim"
              />
            </div>

            <div>
              <label className="label">Telefon Numarası</label>
              <input
                type="tel"
                name="phone"
                required
                value={formData.phone}
                onChange={handleChange}
                className="input-field"
                placeholder="0555 555 55 55"
              />
            </div>

            <div>
              <label className="label">Şehir / İlçe</label>
              <input
                type="text"
                name="city"
                required
                value={formData.city}
                onChange={handleChange}
                className="input-field"
                placeholder="Örn: İstanbul / Kadıköy"
              />
            </div>

            <div>
              <label className="label">Açık Adres</label>
              <textarea
                name="address"
                required
                value={formData.address}
                onChange={handleChange}
                className="input-field min-h-[100px]"
                placeholder="Mahalle, Sokak, Bina No, Daire No..."
              />
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl mt-6">
              <div className="flex items-start gap-3">
                <Smartphone size={24} className="text-blue-600 mt-1" />
                <p className="text-sm text-blue-900 font-medium">
                  Siparişi onayla dediğinizde, sipariş bilgileriniz ile birlikte
                  otomatik olarak WhatsApp destek hattımıza yönlendirileceksiniz.
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary w-full mt-6 flex justify-center items-center gap-2 py-4 text-lg shadow-xl shadow-pink-500/30"
            >
              {submitting ? (
                <div className="spinner w-6 h-6 border-2" />
              ) : (
                "Siparişi Onayla ve WhatsApp'a Git"
              )}
            </button>
          </form>
        </div>

        <div>
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center text-sm">
              2
            </span>
            Sipariş Özeti
          </h2>

          <div className="bg-slate-50 p-6 rounded-3xl border border-border-color">
            <div className="space-y-4 mb-6">
              {cart.map((item) => (
                <div key={item.cartId} className="flex gap-4 items-center">
                  <img
                    src={
                      item.images && item.images.length > 0
                        ? item.images[0]
                        : item.imageUrl
                    }
                    alt={item.title}
                    className="w-16 h-16 object-cover rounded-xl"
                  />
                  <div className="flex-1">
                    <p className="font-bold text-sm line-clamp-1">{item.title}</p>
                    <p className="text-xs text-text-muted mt-1">
                      Yaş: {item.selectedAge} • Adet: {item.quantity || 1}
                    </p>
                  </div>
                  <div className="font-bold">
                    {item.price * (item.quantity || 1)} ₺
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-border-color pt-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-text-muted font-medium">Ara Toplam</span>
                <span className="font-bold">{totalAmount} ₺</span>
              </div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-text-muted font-medium">Kargo</span>
                <span className="font-bold text-green-600">Ücretsiz</span>
              </div>
              <div className="flex justify-between items-center text-xl">
                <span className="font-black">Toplam</span>
                <span className="font-black text-primary-pink">
                  {totalAmount} ₺
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
