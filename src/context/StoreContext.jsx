import { createContext, useContext, useState, useEffect } from 'react';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  setDoc,
  onSnapshot
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { db, storage, auth } from '../firebase';

const StoreContext = createContext();

export const StoreProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [stats, setStats] = useState({
    visitors: 0,
    orders: 0,
    revenue: 0
  });
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('ee_theme') || 'light');
  const [cart, setCart] = useState([]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('ee_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const fetchProducts = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'products'));
      const fetchedProducts = snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data()
      }));
      setProducts(fetchedProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
      alert('Ürünleri çekerken hata oluştu. Veritabanı kuralları açık olmayabilir.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });

    const trackVisitorStats = async () => {
      const globalStatsRef = doc(db, 'stats', 'global');
      const todayKey = new Date().toISOString().split('T')[0];
      const dailyStatsRef = doc(db, 'stats', todayKey);

      try {
        const statsSnap = await getDocs(collection(db, 'stats'));
        const globalDoc = statsSnap.docs.find((d) => d.id === 'global');
        const currentStats = globalDoc
          ? globalDoc.data()
          : { visitors: 0, orders: 0, revenue: 0 };

        if (!globalDoc) {
          await setDoc(globalStatsRef, currentStats);
        }

        if (!sessionStorage.getItem('visited')) {
          sessionStorage.setItem('visited', 'true');
          currentStats.visitors = (currentStats.visitors || 0) + 1;
          await setDoc(globalStatsRef, currentStats, { merge: true });

          const todayDoc = (await getDocs(collection(db, 'stats'))).docs.find(
            (d) => d.id === todayKey
          );

          if (todayDoc) {
            await setDoc(
              dailyStatsRef,
              { visitors: (todayDoc.data().visitors || 0) + 1 },
              { merge: true }
            );
          } else {
            await setDoc(
              dailyStatsRef,
              { visitors: 1, orders: 0, revenue: 0 },
              { merge: true }
            );
          }
        }

        setStats(currentStats);
      } catch (error) {
        console.error('Stats error:', error);
      }
    };

    trackVisitorStats();

    const unsubscribeSettings = onSnapshot(doc(db, 'settings', 'global'), (snap) => {
      if (snap.exists()) {
        setMaintenanceMode(snap.data().isMaintenanceMode || false);
      }
    });

    return () => {
      unsubscribeAuth();
      unsubscribeSettings();
    };
  }, []);

  const addProduct = async (productData) => {
    try {
      const docRef = await addDoc(collection(db, 'products'), productData);
      setProducts([{ ...productData, id: docRef.id }, ...products]);
    } catch (error) {
      console.error('Error adding product:', error);
      alert('Ürün eklenemedi.');
    }
  };

  const updateProduct = async (updatedProduct) => {
    try {
      const productRef = doc(db, 'products', updatedProduct.id);
      const { id, ...fields } = updatedProduct;
      await updateDoc(productRef, fields);
      setProducts(products.map((p) => (p.id === updatedProduct.id ? updatedProduct : p)));
    } catch (error) {
      console.error('Error updating product:', error);
      alert('Ürün güncellenemedi.');
    }
  };

  const deleteProduct = async (productId) => {
    try {
      await deleteDoc(doc(db, 'products', productId));
      setProducts(products.filter((p) => p.id !== productId));
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Ürün silinemedi.');
    }
  };

  const addToCart = (product, selectedAge) => {
    setCart([
      ...cart,
      {
        ...product,
        selectedAge,
        quantity: 1,
        cartId: Date.now()
      }
    ]);
  };

  const removeFromCart = (cartId) => {
    setCart(cart.filter((item) => item.cartId !== cartId));
  };

  const clearCart = () => setCart([]);

  const placeOrder = async (shippingDetails) => {
    if (cart.length === 0) return null;

    const total = cart.reduce(
      (sum, item) => sum + Number(item.price) * (item.quantity || 1),
      0
    );

    try {
      for (const item of cart) {
        if (!item.selectedAge) continue;
        const productRef = doc(db, 'products', item.id);
        const targetProduct = products.find((p) => p.id === item.id);

        if (targetProduct && targetProduct.inventory) {
          const currentQty = targetProduct.inventory[item.selectedAge] || 0;
          const nextQty = Math.max(0, currentQty - (item.quantity || 1));
          await updateDoc(productRef, {
            [`inventory.${item.selectedAge}`]: nextQty
          });
        }
      }

      const orderPayload = {
        userId: user ? user.uid : 'guest',
        userEmail: user ? user.email : 'guest',
        items: cart,
        total,
        shippingDetails,
        status: 'Bekliyor',
        createdAt: new Date().toISOString()
      };

      const orderRef = await addDoc(collection(db, 'orders'), orderPayload);

      const globalStatsRef = doc(db, 'stats', 'global');
      const nextGlobalStats = {
        ...stats,
        orders: stats.orders + 1,
        revenue: stats.revenue + total
      };
      await updateDoc(globalStatsRef, nextGlobalStats);

      const todayKey = new Date().toISOString().split('T')[0];
      const dailyStatsRef = doc(db, 'stats', todayKey);
      const todayDoc = (await getDocs(collection(db, 'stats'))).docs.find(
        (d) => d.id === todayKey
      );

      if (todayDoc) {
        await setDoc(
          dailyStatsRef,
          {
            orders: (todayDoc.data().orders || 0) + 1,
            revenue: (todayDoc.data().revenue || 0) + total
          },
          { merge: true }
        );
      } else {
        await setDoc(
          dailyStatsRef,
          { visitors: 0, orders: 1, revenue: total },
          { merge: true }
        );
      }

      setStats(nextGlobalStats);
      setProducts((prevProducts) =>
        prevProducts.map((product) => {
          const cartMatches = cart.filter((item) => item.id === product.id);
          if (cartMatches.length === 0) return product;

          const updatedInventory = { ...(product.inventory || {}) };
          cartMatches.forEach((item) => {
            if (updatedInventory[item.selectedAge]) {
              updatedInventory[item.selectedAge] = Math.max(
                0,
                updatedInventory[item.selectedAge] - (item.quantity || 1)
              );
            }
          });

          return { ...product, inventory: updatedInventory };
        })
      );

      return orderRef.id;
    } catch (error) {
      console.error('Order Error:', error);
      throw error;
    }
  };

  const uploadImage = async (file) => {
    if (!file) return null;
    try {
      const storageRef = ref(storage, `products/${Date.now()}_${file.name}`);
      const uploadTask = uploadBytes(storageRef, file).then(() =>
        getDownloadURL(storageRef)
      );
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(
          () =>
            reject(
              new Error(
                "Yükleme zaman aşımına uğradı. Firebase Storage'ı Console'dan aktif ettiğinizden veya kuralların açık olduğundan emin olun."
              )
            ),
          15000
        );
      });
      return await Promise.race([uploadTask, timeoutPromise]);
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };

  const logout = () => signOut(auth);

  const toggleMaintenanceMode = async (enabled) => {
    await setDoc(
      doc(db, 'settings', 'global'),
      { isMaintenanceMode: enabled },
      { merge: true }
    );
  };

  return (
    <StoreContext.Provider
      value={{
        products,
        loading,
        addProduct,
        updateProduct,
        deleteProduct,
        cart,
        addToCart,
        removeFromCart,
        clearCart,
        placeOrder,
        stats,
        uploadImage,
        user,
        authLoading,
        logout,
        theme,
        toggleTheme,
        maintenanceMode,
        toggleMaintenanceMode
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => useContext(StoreContext);
