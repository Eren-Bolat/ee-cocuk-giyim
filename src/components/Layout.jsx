import { useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { Sun, Moon, User, ShoppingCart, Menu, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export default function Layout() {
  const { cart, user, theme, toggleTheme, maintenanceMode } = useStore();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isBoysPage = location.pathname === '/erkek-cocuk';
  const isGirlsPage = location.pathname === '/kiz-cocuk';
  const isDefaultPage = !isBoysPage && !isGirlsPage;
  const isAdminUser = user && user.email === 'erenbolat0505@gmail.com';
  const isLoginPage = location.pathname === '/login';

  if (maintenanceMode && !isAdminUser && !isLoginPage) {
    return (
      <div
        className="layout-wrapper"
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--color-light)',
          textAlign: 'center',
          padding: '2rem'
        }}
      >
        <div className="card p-12 rounded-3xl shadow-sm border border-border-color max-w-lg">
          <img
            src={theme === 'dark' ? '/logo_dark.jpg' : '/logo.jpg'}
            alt="ee Çocuk Logo"
            className="h-16 w-auto mx-auto mb-8 rounded-xl object-contain"
          />
          <h1 className="text-3xl font-black mb-4 text-primary-pink">
            Sitemiz Güncelleniyor
          </h1>
          <p className="text-muted text-lg mb-8">
            Sizlere daha iyi hizmet verebilmek için kısa bir bakım molası verdik.
            Yepyeni koleksiyonlarla çok yakında buradayız!
          </p>
          <div className="w-12 h-1 bg-primary-blue mx-auto rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div
      className="layout-wrapper"
      style={{
        position: 'relative',
        minHeight: '100vh',
        backgroundColor: 'var(--color-light)'
      }}
    >
      <div
        className={`bg-layer bg-gradient-mixed ${isDefaultPage ? 'active' : ''}`}
        style={{ zIndex: 0, pointerEvents: 'none' }}
      />
      <div
        className={`bg-layer bg-gradient-blue ${isBoysPage ? 'active' : ''}`}
        style={{ zIndex: 0, pointerEvents: 'none' }}
      />
      <div
        className={`bg-layer bg-gradient-pink ${isGirlsPage ? 'active' : ''}`}
        style={{ zIndex: 0, pointerEvents: 'none' }}
      />

      <div
        style={{
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh'
        }}
      >
        <header className="header">
          <div className="container header-inner">
            <Link to="/" className="logo-link">
              <img
                src="/logo.jpg"
                alt="ee Çocuk Logo"
                className="h-12 w-auto object-contain rounded-xl"
                style={{ maxHeight: '50px' }}
              />
            </Link>

            <nav className="main-nav">
              <NavLink
                to="/"
                end
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                Ana Sayfa
              </NavLink>
              <NavLink
                to="/kiz-cocuk"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                Kız Çocuk
              </NavLink>
              <NavLink
                to="/erkek-cocuk"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                Erkek Çocuk
              </NavLink>
              {user?.email === 'erenbolat0505@gmail.com' && (
                <Link to="/admin" className="nav-link demo text-primary-pink">
                  Admin Paneli
                </Link>
              )}
            </nav>

            <div className="header-actions">
              <button
                onClick={toggleTheme}
                className="cart-btn"
                aria-label="Karanlık Mod Değiştir"
              >
                {theme === 'dark' ? (
                  <Sun size={22} strokeWidth={1.5} />
                ) : (
                  <Moon size={22} strokeWidth={1.5} />
                )}
              </button>

              <Link
                to={user ? '/profile' : '/login'}
                className="cart-btn"
                title="Hesabım"
              >
                <User size={22} strokeWidth={1.5} />
              </Link>

              <Link to="/cart" className="cart-btn" title="Sepetim">
                <ShoppingCart size={22} strokeWidth={1.5} />
                {cart.length > 0 && (
                  <span className="cart-badge">{cart.length}</span>
                )}
              </Link>

              <button
                className="menu-btn md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? (
                  <X size={24} strokeWidth={1.5} />
                ) : (
                  <Menu size={24} strokeWidth={1.5} />
                )}
              </button>
            </div>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden card border-t border-border-color shadow-md">
              <nav className="flex flex-col p-4 gap-2">
                <NavLink
                  to="/"
                  end
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `p-3 rounded-xl font-bold transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-primary-blue'
                        : 'text-text-main hover:bg-slate-50'
                    }`
                  }
                >
                  Ana Sayfa
                </NavLink>
                <NavLink
                  to="/kiz-cocuk"
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `p-3 rounded-xl font-bold transition-colors ${
                      isActive
                        ? 'bg-pink-100 text-primary-pink'
                        : 'text-text-main hover:bg-slate-50'
                    }`
                  }
                >
                  Kız Çocuk
                </NavLink>
                <NavLink
                  to="/erkek-cocuk"
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `p-3 rounded-xl font-bold transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-primary-blue'
                        : 'text-text-main hover:bg-slate-50'
                    }`
                  }
                >
                  Erkek Çocuk
                </NavLink>
                {user?.email === 'erenbolat0505@gmail.com' && (
                  <Link
                    to="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-3 rounded-xl font-bold text-primary-pink mt-2 border-t border-border-color"
                  >
                    Admin Paneli
                  </Link>
                )}
              </nav>
            </div>
          )}
        </header>

        <main className="main-content container" style={{ flex: 1 }}>
          <Outlet />
        </main>

        <footer className="footer" style={{ marginTop: 'auto' }}>
          <div className="container">
            <p className="footer-text">
              EE Çocuk Giyim{' '}
              <a
                href="https://instagram.com/eecocuk"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-blue hover:underline"
              >
                İnstagram:@eecocuk
              </a>
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
