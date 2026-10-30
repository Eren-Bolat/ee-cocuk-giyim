import { useState } from 'react';
import { Link, Navigate, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingBag, Home, LogOut, Menu } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export default function AdminLayout() {
  const location = useLocation();
  const { user, authLoading, logout } = useStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Yükleniyor...
      </div>
    );
  }

  if (!user || user.email !== 'erenbolat0505@gmail.com') {
    return <Navigate to="/login" replace />;
  }

  const getNavLinkClass = (path) =>
    location.pathname === path
      ? 'bg-primary-blue text-white'
      : 'text-text-main hover:bg-slate-100 dark:hover:bg-slate-800';

  return (
    <div
      className="flex h-screen"
      style={{
        backgroundColor: 'var(--color-light)',
        color: 'var(--color-dark)'
      }}
    >
      <aside
        className={`w-64 card border-r border-border-color flex flex-col ${
          sidebarOpen ? 'block' : 'hidden'
        } md:flex fixed md:static inset-y-0 left-0 z-50`}
        style={{ borderRadius: 0 }}
      >
        <div className="p-6 border-b border-border-color">
          <Link to="/admin" className="flex items-center gap-2">
            <img
              src="/logo.jpg"
              alt="ee Çocuk"
              className="h-10 w-auto object-contain rounded-xl"
            />
          </Link>
        </div>

        <nav className="flex-1 p-4 flex flex-col gap-2">
          <Link
            to="/admin"
            className={`flex items-center gap-3 p-3 rounded-xl font-semibold transition-colors ${getNavLinkClass('/admin')}`}
          >
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </Link>

          <Link
            to="/admin/products"
            className={`flex items-center gap-3 p-3 rounded-xl font-semibold transition-colors ${getNavLinkClass('/admin/products')}`}
          >
            <Package size={20} />
            <span>Ürünler</span>
          </Link>

          <Link
            to="/admin/orders"
            className={`flex items-center gap-3 p-3 rounded-xl font-semibold transition-colors ${getNavLinkClass('/admin/orders')}`}
          >
            <ShoppingBag size={20} />
            <span>Siparişler</span>
          </Link>

          <div className="mt-auto flex flex-col gap-2 border-t border-border-color pt-4">
            <Link
              to="/"
              className="flex items-center gap-3 p-3 rounded-xl font-semibold text-text-main hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Home size={20} />
              <span>Mağazaya Dön</span>
            </Link>

            <button
              onClick={logout}
              className="flex items-center gap-3 p-3 rounded-xl font-semibold text-red-400 hover:bg-red-500 hover:text-white transition-colors w-full text-left"
            >
              <LogOut size={20} />
              <span>Çıkış Yap</span>
            </button>
          </div>
        </nav>
      </aside>

      <main
        className="flex-1 flex flex-col min-w-0 overflow-hidden"
        style={{ backgroundColor: 'var(--color-light)' }}
      >
        <header
          className="md:hidden card border-b border-border-color p-4 flex items-center justify-between sticky top-0 z-10"
          style={{ borderRadius: 0 }}
        >
          <Link to="/admin" className="font-bold text-lg">
            ee Yönetici Paneli
          </Link>
          <button onClick={() => setSidebarOpen(!sidebarOpen)}>
            <Menu size={24} />
          </button>
        </header>

        <div className="flex-1 p-6 md:p-8 overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
