import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { StoreProvider } from './context/StoreContext';
import Layout from './components/Layout';
import AdminLayout from './components/AdminLayout';
import Home from './pages/Home';
import GenderPage from './pages/GenderPage';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Dashboard from './pages/admin/Dashboard';
import Products from './pages/admin/Products';
import Orders from './pages/admin/Orders';

export default function App() {
  return (
    <StoreProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route
              path="kiz-cocuk"
              element={<GenderPage gender="Kız" title="Kız Çocuk Koleksiyonu" />}
            />
            <Route
              path="erkek-cocuk"
              element={<GenderPage gender="Erkek" title="Erkek Çocuk Koleksiyonu" />}
            />
            <Route path="cart" element={<Cart />} />
            <Route path="checkout" element={<Checkout />} />
            <Route path="login" element={<Login />} />
            <Route path="profile" element={<Profile />} />
            <Route path="product/:id" element={<ProductDetail />} />
          </Route>

          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="products" element={<Products />} />
            <Route path="orders" element={<Orders />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </StoreProvider>
  );
}
