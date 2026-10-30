import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  orderBy,
  getDocs
} from 'firebase/firestore';
import {
  LogOut,
  MapPin,
  Package,
  Clock,
  CheckCircle2,
  Truck,
  XCircle
} from 'lucide-react';
import { db } from '../firebase';
import { useStore } from '../context/StoreContext';

export default function Profile() {
  const { user, authLoading, logout } = useStore();
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [address, setAddress] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
      return;
    }

    if (user) {
      getDoc(doc(db, 'users', user.uid)).then((snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setName(data.name || '');
          setSurname(data.surname || '');
          setAddress(data.address || '');
        }
      });

      const fetchUserOrders = async () => {
        try {
          const q = query(
            collection(db, 'orders'),
            where('userId', '==', user.uid),
            orderBy('createdAt', 'desc')
          );
          const snap = await getDocs(q);
          setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        } catch (err) {
          console.error('Order fetch error (may need composite index):', err);
          try {
            const fallbackQ = query(
              collection(db, 'orders'),
              where('userId', '==', user.uid)
            );
            const snap = await getDocs(fallbackQ);
            const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
            list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setOrders(list);
          } catch {
            // ignore fallback errors
          }
        } finally {
          setOrdersLoading(false);
        }
      };

      fetchUserOrders();
    }
  }, [user, authLoading, navigate]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    try {
      await setDoc(
        doc(db, 'users', user.uid),
        { name, surname, address },
        { merge: true }
      );
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    }
    setSaving(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'Bekliyor':
        return (
          <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-bold flex items-center gap-1 w-max">
            <Clock size={16} /> Bekliyor
          </span>
        );
      case 'Onaylandı':
        return (
          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-bold flex items-center gap-1 w-max">
            <CheckCircle2 size={16} /> Onaylandı
          </span>
        );
      case 'Kargoya Verildi':
        return (
          <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-bold flex items-center gap-1 w-max">
            <Truck size={16} /> Kargoya Verildi
          </span>
        );
      case 'İptal':
        return (
          <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-bold flex items-center gap-1 w-max">
            <XCircle size={16} /> İptal Edildi
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm font-bold flex items-center gap-1 w-max">
            {status}
          </span>
        );
    }
  };

  if (authLoading || !user) {
    return (
      <div className="p-20 text-center">
        <div className="spinner mx-auto" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-black">Hesabım</h1>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-red-500 hover:text-red-600 font-bold"
        >
          <LogOut size={20} /> Çıkış Yap
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <div className="card p-6 rounded-3xl shadow-sm border border-border-color">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <MapPin size={24} className="text-primary-pink" /> Adres Bilgilerim
            </h2>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="label">Ad</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field"
                  placeholder="Adınız"
                />
              </div>

              <div>
                <label className="label">Soyad</label>
                <input
                  type="text"
                  value={surname}
                  onChange={(e) => setSurname(e.target.value)}
                  className="input-field"
                  placeholder="Soyadınız"
                />
              </div>

              <div>
                <label className="label">Teslimat Adresi</label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="input-field min-h-[120px]"
                  placeholder="Mahalle, Sokak, No..."
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="btn btn-primary w-full mt-4 py-3"
              >
                {saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
              </button>

              {savedSuccess && (
                <p className="text-green-600 font-bold text-center mt-2">
                  Başarıyla kaydedildi!
                </p>
              )}
            </form>
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="card p-6 rounded-3xl shadow-sm border border-border-color">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Package size={24} className="text-primary-blue" /> Önceki Siparişlerim
            </h2>

            {ordersLoading ? (
              <div className="text-center p-8 text-text-muted">
                <div className="spinner mx-auto mb-4" />
                Siparişler yükleniyor...
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center p-12 bg-slate-50 rounded-2xl border border-dashed border-border-color">
                <Package size={48} className="mx-auto mb-4 text-slate-300" />
                <p className="text-text-muted font-bold">
                  Henüz hiç sipariş vermediniz.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="border border-border-color rounded-2xl overflow-hidden"
                  >
                    <div className="bg-slate-50 p-4 border-b border-border-color flex flex-wrap justify-between items-center gap-4">
                      <div>
                        <p className="text-xs font-bold text-text-muted mb-1">
                          {new Date(order.createdAt).toLocaleDateString('tr-TR')}
                        </p>
                        <p className="text-sm font-black">
                          Sipariş No: #{order.id.substring(0, 8).toUpperCase()}
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        {renderStatusBadge(order.status)}
                        <span className="font-black text-primary-pink text-lg">
                          {order.total} ₺
                        </span>
                      </div>
                    </div>

                    <div className="p-4 space-y-3">
                      {order.items?.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between items-center"
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={
                                item.images && item.images.length > 0
                                  ? item.images[0]
                                  : item.imageUrl
                              }
                              alt={item.title}
                              className="w-12 h-12 object-cover rounded-lg"
                            />
                            <div>
                              <p className="font-bold text-sm line-clamp-1">
                                {item.title}
                              </p>
                              <p className="text-xs text-text-muted">
                                Yaş: {item.selectedAge} • {item.quantity || 1} Adet
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
