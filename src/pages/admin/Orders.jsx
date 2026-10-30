import { useState, useEffect } from 'react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  getDoc,
  deleteDoc
} from 'firebase/firestore';
import {
  Clock,
  CheckCircle2,
  Truck,
  XCircle,
  Search,
  Calendar,
  Package,
  Trash2
} from 'lucide-react';
import { db } from '../../firebase';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('Bekliyor');
  const [dateRange, setDateRange] = useState('Tümü');

  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data()
      }));
      setOrders(list);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleStatusChange = async (order, nextStatus) => {
    try {
      const prevStatus = order.status;
      if (prevStatus === nextStatus) return;

      await updateDoc(doc(db, 'orders', order.id), {
        status: nextStatus
      });

      const wasCancelled =
        nextStatus.includes('ptal') && !prevStatus.includes('ptal');
      const wasRestored =
        prevStatus.includes('ptal') && !nextStatus.includes('ptal');

      if (wasCancelled || wasRestored) {
        for (const item of order.items) {
          if (!item.selectedAge) continue;
          const productRef = doc(db, 'products', item.id);
          const productSnap = await getDoc(productRef);

          if (productSnap.exists()) {
            const currentQty =
              productSnap.data().inventory?.[item.selectedAge] || 0;
            const itemQty = item.quantity || 1;
            const nextQty = wasCancelled
              ? currentQty + itemQty
              : Math.max(0, currentQty - itemQty);

            await updateDoc(productRef, {
              [`inventory.${item.selectedAge}`]: nextQty
            });
          }
        }

        const globalStatsRef = doc(db, 'stats', 'global');
        const globalSnap = await getDoc(globalStatsRef);
        if (globalSnap.exists()) {
          const data = globalSnap.data();
          const currentOrders = data.orders || 0;
          const currentRevenue = data.revenue || 0;

          if (wasCancelled) {
            await updateDoc(globalStatsRef, {
              orders: Math.max(0, currentOrders - 1),
              revenue: Math.max(0, currentRevenue - order.total)
            });
          } else {
            await updateDoc(globalStatsRef, {
              orders: currentOrders + 1,
              revenue: currentRevenue + order.total
            });
          }
        }

        if (order.createdAt) {
          const dayKey = new Date(order.createdAt).toISOString().split('T')[0];
          const dailyStatsRef = doc(db, 'stats', dayKey);
          const dailySnap = await getDoc(dailyStatsRef);

          if (dailySnap.exists()) {
            const data = dailySnap.data();
            const dayOrders = data.orders || 0;
            const dayRevenue = data.revenue || 0;

            if (wasCancelled) {
              await updateDoc(dailyStatsRef, {
                orders: Math.max(0, dayOrders - 1),
                revenue: Math.max(0, dayRevenue - order.total)
              });
            } else {
              await updateDoc(dailyStatsRef, {
                orders: dayOrders + 1,
                revenue: dayRevenue + order.total
              });
            }
          }
        }
      }
    } catch (error) {
      console.error('Status Update Error:', error);
      alert('Durum güncellenirken hata oluştu!');
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (
      !window.confirm(
        'Bu siparişi kalıcı olarak silmek istediğinize emin misiniz? (Bu işlem geri alınamaz ve stokları iade ETMEZ)'
      )
    ) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'orders', orderId));
    } catch (error) {
      console.error('Delete Error:', error);
      alert('Sipariş silinirken hata oluştu!');
    }
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
            <XCircle size={16} /> İptal
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 bg-slate-100 text-text-main rounded-full text-sm font-bold flex items-center gap-1 w-max">
            {status}
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="text-center p-12 text-slate-400 font-bold">
        Siparişler yükleniyor...
      </div>
    );
  }

  const todayStr = new Date().toISOString().split('T')[0];

  const filteredOrders = orders.filter((order) => {
    const matchesSearch = `${order.id} ${order.shippingDetails?.fullName} ${order.userEmail}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === 'Tümü' || order.status === statusFilter;

    let matchesDate = true;
    if (order.createdAt) {
      const createdDate = new Date(order.createdAt);
      const createdDayStr = createdDate.toISOString().split('T')[0];

      if (dateRange === 'Bugün') {
        matchesDate = createdDayStr === todayStr;
      } else if (dateRange === 'Son 7 Gün') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        matchesDate = createdDate >= weekAgo;
      } else if (dateRange === 'Bu Ay') {
        matchesDate = createdDayStr.substring(0, 7) === todayStr.substring(0, 7);
      }
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-black text-slate-100">Siparişler</h1>
        <div className="bg-slate-800 px-4 py-2 rounded-xl border border-slate-700 text-slate-300 font-bold">
          Toplam: {filteredOrders.length} Sipariş
        </div>
      </div>

      <div className="bg-slate-50 p-6 rounded-3xl shadow-sm border border-border-color mb-8 transition-colors">
        <div className="flex flex-wrap gap-2 mb-6 border-b border-border-color pb-4">
          {['Tümü', 'Bekliyor', 'Onaylandı', 'Kargoya Verildi', 'İptal'].map(
            (tab) => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${
                  statusFilter === tab
                    ? 'bg-primary-blue text-white shadow-md transform scale-105'
                    : 'text-text-main dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                {tab}
              </button>
            )
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="relative w-full lg:w-1/2">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="İsim, E-posta veya Sipariş NO ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-10 w-full card"
            />
          </div>

          <div className="flex flex-wrap gap-2 w-full lg:w-auto justify-end">
            <div className="flex items-center flex-wrap gap-1 card border border-border-color rounded-2xl p-1.5 shadow-sm">
              <span className="text-slate-400 px-2 hidden md:flex items-center">
                <Calendar size={16} />
              </span>
              {['Tümü', 'Bugün', 'Son 7 Gün', 'Bu Ay'].map((range) => (
                <button
                  key={range}
                  onClick={() => setDateRange(range)}
                  className={`px-3 py-1.5 rounded-xl text-sm font-bold transition-colors ${
                    dateRange === range
                      ? 'bg-slate-800 dark:bg-slate-700 text-white shadow-sm'
                      : 'text-text-main dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {filteredOrders.length === 0 ? (
          <div className="text-center p-12 bg-slate-800 rounded-3xl border border-slate-700 text-slate-400">
            <Package size={48} className="mx-auto mb-4 opacity-50" />
            <p className="font-bold">Henüz sipariş bulunmuyor.</p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div
              key={order.id}
              className="bg-slate-800 rounded-3xl border border-slate-700 overflow-hidden"
            >
              <div className="p-6 border-b border-slate-700 flex flex-wrap justify-between items-center gap-4 bg-slate-800/50">
                <div>
                  <p className="text-slate-400 text-xs font-bold mb-1">
                    SİPARİŞ NO: #{order.id.substring(0, 8).toUpperCase()}
                  </p>
                  <h3 className="text-lg font-black text-slate-200">
                    {order.shippingDetails?.fullName}
                  </h3>
                  <p className="text-slate-400 text-sm">
                    {order.userEmail} • {order.shippingDetails?.phone}
                  </p>
                  <p className="text-slate-400 text-sm mt-1">
                    {order.shippingDetails?.address}, {order.shippingDetails?.city}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-4">
                  {renderStatusBadge(order.status)}

                  <div className="flex items-center gap-2">
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusChange(order, e.target.value)}
                      className="input-field py-2 cursor-pointer font-bold w-full md:w-48"
                    >
                      <option value="Bekliyor">Durum: Bekliyor</option>
                      <option value="Onaylandı">Durum: Onaylandı</option>
                      <option value="Kargoya Verildi">
                        Durum: Kargoya Verildi
                      </option>
                      <option value="İptal">Durum: İptal</option>
                    </select>

                    <button
                      onClick={() => handleDeleteOrder(order.id)}
                      className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors"
                      title="Siparişi Sil"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-slate-900">
                <h4 className="text-sm font-bold text-slate-400 mb-4">
                  SİPARİŞ DETAYI
                </h4>
                <div className="space-y-3">
                  {order.items?.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center"
                    >
                      <div className="flex items-center gap-4">
                        <img
                          src={
                            item.images && item.images.length > 0
                              ? item.images[0]
                              : item.imageUrl
                          }
                          alt={item.title}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                        <div>
                          <p className="text-slate-300 font-bold text-sm">
                            {item.title}
                          </p>
                          <p className="text-slate-500 text-xs">
                            Yaş: {item.selectedAge} • {item.quantity || 1} Adet
                          </p>
                        </div>
                      </div>
                      <p className="text-slate-300 font-bold">
                        {item.price * (item.quantity || 1)} ₺
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-4 border-t border-slate-700 flex justify-between items-center">
                  <p className="text-slate-400 font-bold">Toplam Tutar:</p>
                  <p className="text-2xl font-black text-primary-pink">
                    {order.total} ₺
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
