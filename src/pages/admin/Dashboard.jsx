import { useState, useEffect } from 'react';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { RefreshCw, Calendar, DollarSign, Users, ShoppingBag } from 'lucide-react';
import { db } from '../../firebase';
import { useStore } from '../../context/StoreContext';

function StatCard({ title, value, icon }) {
  return (
    <div className="bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-700">
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-slate-700 rounded-2xl">{icon}</div>
      </div>
      <div>
        <p className="text-slate-400 text-sm font-medium mb-1">{title}</p>
        <h3 className="text-3xl font-black text-slate-100">{value}</h3>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { maintenanceMode, toggleMaintenanceMode } = useStore();
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [dailyStats, setDailyStats] = useState([]);
  const [globalStats, setGlobalStats] = useState({
    visitors: 0,
    orders: 0,
    revenue: 0
  });
  const [filteredStats, setFilteredStats] = useState({
    visitors: 0,
    orders: 0,
    revenue: 0
  });
  const [loading, setLoading] = useState(true);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, idx) => currentYear - idx);
  const months = [
    { value: '01', label: 'Ocak' },
    { value: '02', label: 'Şubat' },
    { value: '03', label: 'Mart' },
    { value: '04', label: 'Nisan' },
    { value: '05', label: 'Mayıs' },
    { value: '06', label: 'Haziran' },
    { value: '07', label: 'Temmuz' },
    { value: '08', label: 'Ağustos' },
    { value: '09', label: 'Eylül' },
    { value: '10', label: 'Ekim' },
    { value: '11', label: 'Kasım' },
    { value: '12', label: 'Aralık' }
  ];

  useEffect(() => {
    const loadStats = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'stats'));
        const allDocs = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data()
        }));

        const globalDoc = allDocs.find((d) => d.id === 'global');
        if (globalDoc) setGlobalStats(globalDoc);

        const dailyDocs = allDocs.filter(
          (d) => d.id !== 'global' && d.id.includes('-')
        );
        setDailyStats(dailyDocs);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  useEffect(() => {
    if (loading) return;
    if (dateFilter === 'all') {
      setFilteredStats(globalStats);
      return;
    }

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    let matches = [];

    if (dateFilter === 'today') {
      matches = dailyStats.filter((d) => d.id === todayStr);
    } else if (dateFilter === 'week') {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(
        now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1)
      );
      const startStr = startOfWeek.toISOString().split('T')[0];
      matches = dailyStats.filter((d) => d.id >= startStr && d.id <= todayStr);
    } else if (dateFilter === 'month') {
      const monthPrefix = todayStr.substring(0, 7);
      matches = dailyStats.filter((d) => d.id.startsWith(monthPrefix));
    } else if (dateFilter === 'year') {
      const yearPrefix = now.getFullYear().toString();
      matches = dailyStats.filter((d) => d.id.startsWith(yearPrefix));
    } else if (dateFilter === 'custom') {
      if (selectedYear && selectedMonth) {
        matches = dailyStats.filter((d) =>
          d.id.startsWith(`${selectedYear}-${selectedMonth}`)
        );
      } else if (selectedYear) {
        matches = dailyStats.filter((d) => d.id.startsWith(selectedYear));
      }
    }

    const aggregated = matches.reduce(
      (acc, entry) => ({
        visitors: acc.visitors + (entry.visitors || 0),
        orders: acc.orders + (entry.orders || 0),
        revenue: acc.revenue + (entry.revenue || 0)
      }),
      { visitors: 0, orders: 0, revenue: 0 }
    );

    setFilteredStats(aggregated);
  }, [dateFilter, selectedMonth, selectedYear, dailyStats, globalStats, loading]);

  const handleCustomDateChange = (type, value) => {
    setDateFilter('custom');
    if (type === 'year') setSelectedYear(value);
    if (type === 'month') setSelectedMonth(value);
  };

  const handleRecalculateStats = async () => {
    if (
      !window.confirm(
        'İstatistikleri yeniden hesaplamak istediğinize emin misiniz? (Bu işlem birkaç saniye sürebilir)'
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      const ordersSnap = await getDocs(collection(db, 'orders'));
      const validOrders = ordersSnap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((o) => !o.status.includes('ptal'));

      const totalOrders = validOrders.length;
      const totalRevenue = validOrders.reduce(
        (sum, order) => sum + (order.total || 0),
        0
      );

      await updateDoc(doc(db, 'stats', 'global'), {
        orders: totalOrders,
        revenue: totalRevenue
      });

      const byDate = {};
      validOrders.forEach((order) => {
        if (order.createdAt) {
          const dayKey = new Date(order.createdAt).toISOString().split('T')[0];
          if (!byDate[dayKey]) {
            byDate[dayKey] = { orders: 0, revenue: 0 };
          }
          byDate[dayKey].orders += 1;
          byDate[dayKey].revenue += order.total || 0;
        }
      });

      const statsSnap = await getDocs(collection(db, 'stats'));
      for (const statDoc of statsSnap.docs) {
        if (statDoc.id !== 'global' && statDoc.id.includes('-')) {
          const dayKey = statDoc.id;
          const dayOrders = byDate[dayKey]?.orders || 0;
          const dayRevenue = byDate[dayKey]?.revenue || 0;
          await updateDoc(doc(db, 'stats', dayKey), {
            orders: dayOrders,
            revenue: dayRevenue
          });
        }
      }

      alert('İstatistikler başarıyla düzeltildi!');
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert('Hata oluştu!');
    } finally {
      setLoading(false);
    }
  };

  const filterLabels = {
    today: 'Bugün',
    week: 'Bu Hafta',
    month: 'Bu Ay',
    year: 'Bu Yıl',
    all: 'Tüm Zamanlar'
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <h1 className="text-3xl font-black text-slate-100">Dashboard</h1>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRecalculateStats}
            className="px-4 py-2 rounded-xl text-sm font-bold bg-slate-200 text-text-main hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors flex items-center gap-2 border border-slate-700"
            title="Eğer sipariş sildiyseniz bu butona basarak istatistikleri düzeltebilirsiniz."
          >
            <RefreshCw size={16} />
            İstatistikleri Düzelt
          </button>

          <button
            onClick={() => toggleMaintenanceMode(!maintenanceMode)}
            className={`px-4 py-2 rounded-xl font-bold transition-all ${
              maintenanceMode
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            {maintenanceMode ? '🚨 Bakım Modu AÇIK' : 'Bakım Modunu Aç'}
          </button>
        </div>
      </div>

      <div className="bg-slate-50 p-6 rounded-3xl shadow-sm border border-border-color mb-8 flex flex-col lg:flex-row gap-6 justify-between items-center transition-colors">
        <div className="flex flex-wrap gap-3 w-full lg:w-auto justify-center">
          {['today', 'week', 'month', 'year', 'all'].map((range) => (
            <button
              key={range}
              onClick={() => setDateFilter(range)}
              className={`px-5 py-2.5 rounded-2xl text-sm font-black tracking-wide transition-all duration-300 ${
                dateFilter === range
                  ? 'bg-primary-blue text-white shadow-md transform scale-105'
                  : 'card text-text-main hover:bg-slate-200 shadow-sm border border-border-color'
              }`}
            >
              {filterLabels[range]}
            </button>
          ))}
        </div>

        <div className="flex gap-4 items-center w-full lg:w-auto justify-center">
          <div className="flex items-center card border border-border-color rounded-2xl px-4 py-2 shadow-sm focus-within:border-primary-blue transition-colors">
            <Calendar size={18} className="text-primary-blue mr-3" />

            <select
              value={selectedMonth}
              onChange={(e) => handleCustomDateChange('month', e.target.value)}
              className="bg-transparent text-sm font-bold outline-none cursor-pointer text-text-main appearance-none pr-4"
            >
              <option value="" className="text-slate-500">
                Ay Seçin
              </option>
              {months.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>

            <div className="w-px h-5 bg-slate-300 dark:bg-slate-700 mx-2" />

            <select
              value={selectedYear}
              onChange={(e) => handleCustomDateChange('year', e.target.value)}
              className="bg-transparent text-sm font-bold outline-none cursor-pointer text-text-main appearance-none pl-2"
            >
              <option value="" className="text-slate-500">
                Yıl Seçin
              </option>
              {years.map((yr) => (
                <option key={yr} value={yr.toString()}>
                  {yr}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400 font-bold">
          <div className="spinner w-8 h-8 mx-auto mb-4 border-2" /> Yükleniyor...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <StatCard
            title="Toplam Satış"
            value={`${(filteredStats?.revenue || 0).toLocaleString('tr-TR')} ₺`}
            icon={<DollarSign size={24} className="text-blue-400" />}
          />
          <StatCard
            title="Ziyaretçiler"
            value={(filteredStats?.visitors || 0).toLocaleString('tr-TR')}
            icon={<Users size={24} className="text-pink-400" />}
          />
          <StatCard
            title="Siparişler"
            value={(filteredStats?.orders || 0).toLocaleString('tr-TR')}
            icon={<ShoppingBag size={24} className="text-orange-400" />}
          />
        </div>
      )}
    </div>
  );
}
