import { useState, useEffect, useRef } from 'react';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import {
  Plus,
  Search,
  Filter,
  Box,
  ArrowUpDown,
  SquarePen,
  Trash2
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';

const ALL_SIZES = [
  '0-3 ay', '3-6 ay', '6-9 ay', '9-12 ay',
  '1 Yaş', '2 Yaş', '3 Yaş', '4 Yaş', '5 Yaş', '6 Yaş',
  '7 Yaş', '8 Yaş', '9 Yaş', '10 Yaş', '11 Yaş', '12 Yaş',
  '13 Yaş', '14 Yaş', '15 Yaş', '16 Yaş', '17 Yaş', '18 Yaş',
  'S', 'M', 'L', 'XL'
];

function ProductForm({ onSubmit, initialData }) {
  const [processing, setProcessing] = useState(false);
  const [previewLightbox, setPreviewLightbox] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    price: '',
    category: 'Elbise',
    gender: 'Unisex',
    imageUrl: '',
    images: [],
    inventory: {}
  });

  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [rawImageSrc, setRawImageSrc] = useState();
  const imgRef = useRef(null);
  const [crop, setCrop] = useState({
    unit: '%',
    width: 90,
    aspect: 4 / 5
  });
  const [completedCrop, setCompletedCrop] = useState(null);

  useEffect(() => {
    setFormData(
      initialData
        ? {
            title: initialData.title || '',
            price: initialData.price || '',
            category: initialData.category || 'Elbise',
            gender: initialData.gender || 'Unisex',
            imageUrl: initialData.imageUrl || '',
            images:
              initialData.images ||
              (initialData.imageUrl ? [initialData.imageUrl] : []),
            inventory: initialData.inventory || {}
          }
        : {
            title: '',
            price: '',
            category: 'Elbise',
            gender: 'Unisex',
            imageUrl: '',
            images: [],
            inventory: {}
          }
    );
  }, [initialData]);

  const adjustSizeStock = (size, delta) => {
    setFormData((prev) => {
      const nextInventory = { ...prev.inventory };
      const current = nextInventory[size] || 0;
      const updated = Math.max(0, current + delta);
      if (updated === 0) {
        delete nextInventory[size];
      } else {
        nextInventory[size] = updated;
      }
      return { ...prev, inventory: nextInventory };
    });
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setRawImageSrc(reader.result);
      setCropModalOpen(true);
    };
    reader.readAsDataURL(file);
    e.target.value = null;
  };

  const handleConfirmCrop = () => {
    if (!completedCrop || !imgRef.current) {
      setCropModalOpen(false);
      return;
    }

    setProcessing(true);
    const image = imgRef.current;
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    const cropWidth = completedCrop.width * scaleX;
    const cropHeight = completedCrop.height * scaleY;

    const maxWidth = 1080;
    const maxHeight = 1350;
    let outWidth = cropWidth;
    let outHeight = cropHeight;

    if (outWidth > maxWidth || outHeight > maxHeight) {
      const ratio = Math.min(maxWidth / outWidth, maxHeight / outHeight);
      outWidth *= ratio;
      outHeight *= ratio;
    }

    canvas.width = outWidth;
    canvas.height = outHeight;
    canvas
      .getContext('2d')
      .drawImage(
        image,
        completedCrop.x * scaleX,
        completedCrop.y * scaleY,
        cropWidth,
        cropHeight,
        0,
        0,
        outWidth,
        outHeight
      );

    const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, compressedDataUrl],
      imageUrl: prev.images.length === 0 ? compressedDataUrl : prev.imageUrl
    }));

    setProcessing(false);
    setCropModalOpen(false);
  };

  const removeImageAt = (targetIdx) => {
    setFormData((prev) => {
      const remaining = prev.images.filter((_, idx) => idx !== targetIdx);
      return {
        ...prev,
        images: remaining,
        imageUrl: remaining.length > 0 ? remaining[0] : ''
      };
    });
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ ...formData, price: Number(formData.price) });
      }}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="label">Ürün Adı</label>
          <input
            required
            type="text"
            className="input-field"
            placeholder="Örn: Mavi Yazlık Elbise"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
          />
        </div>

        <div>
          <label className="label">Fiyat (₺)</label>
          <input
            required
            type="number"
            className="input-field"
            placeholder="350"
            value={formData.price}
            onChange={(e) =>
              setFormData({ ...formData, price: e.target.value })
            }
          />
        </div>

        <div>
          <label className="label">Kategori</label>
          <select
            className="input-field"
            value={formData.category}
            onChange={(e) =>
              setFormData({ ...formData, category: e.target.value })
            }
          >
            <option value="Elbise">Elbise</option>
            <option value="Tişört">Tişört</option>
            <option value="Pantolon">Pantolon</option>
            <option value="Takım">Takım</option>
            <option value="Aksesuar">Aksesuar</option>
          </select>
        </div>

        <div>
          <label className="label">Cinsiyet</label>
          <select
            className="input-field"
            value={formData.gender}
            onChange={(e) =>
              setFormData({ ...formData, gender: e.target.value })
            }
          >
            <option value="Kız">Kız</option>
            <option value="Erkek">Erkek</option>
            <option value="Unisex">Unisex</option>
          </select>
        </div>

        <div className="col-span-1 md:col-span-2">
          <label className="label">
            Ürün Görselleri (Çoklu Fotoğraf Eklenebilir)
          </label>
          <div className="flex flex-col gap-2">
            <input
              type="file"
              accept="image/*"
              className="input-field cursor-pointer"
              onChange={handleFileSelect}
              disabled={processing}
            />
            <span className="text-xs text-red-500 font-bold mt-1">
              ⚠️ Lütfen 5MB'dan büyük görsel yüklemeyin. Sistem yüksek kalite
              1080x1350 formatında sıkıştıracaktır. 1MB doküman limitine
              takılmamak için maksimum 3-4 görsel eklemeniz önerilir.
            </span>

            {formData.images && formData.images.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-4">
                {formData.images.map((imgSrc, idx) => (
                  <div
                    key={idx}
                    className="relative group"
                    style={{ width: '96px', height: '128px' }}
                  >
                    <img
                      src={imgSrc}
                      alt={`Görsel ${idx + 1}`}
                      className="w-full h-full object-cover rounded-xl border border-slate-700 shadow-sm cursor-pointer"
                      onClick={() => setPreviewLightbox(imgSrc)}
                    />
                    <button
                      type="button"
                      onClick={() => removeImageAt(idx)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    >
                      <Trash2 size={16} />
                    </button>
                    {idx === 0 && (
                      <span className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-[10px] font-bold px-2 py-1 rounded-md whitespace-nowrap shadow-md z-10">
                        Ana Görsel
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            <span className="text-sm font-bold text-center mt-4">
              VEYA LİNK KULLAN
            </span>
            <input
              type="url"
              className="input-field"
              placeholder="Görsel Linki Yapıştırın (Örn: https://...)"
              required={formData.images.length === 0 && !formData.imageUrl}
              value={formData.imageUrl}
              onChange={(e) => {
                const url = e.target.value;
                setFormData((prev) => ({
                  ...prev,
                  imageUrl: url,
                  images: url ? [url] : []
                }));
              }}
            />
          </div>
          {processing && (
            <p className="text-sm text-primary-blue mt-2 font-bold animate-pulse">
              İşleniyor...
            </p>
          )}
        </div>
      </div>

      {cropModalOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/90 flex items-center justify-center p-4">
          <div className="bg-slate-800 p-6 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-700 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-4">
              Görseli Kırp (4:5 Formatı)
            </h3>

            <div className="bg-slate-900 rounded-xl overflow-hidden mb-4 flex justify-center items-center">
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(pixelCrop) => setCompletedCrop(pixelCrop)}
                aspect={4 / 5}
              >
                <img
                  ref={imgRef}
                  alt="Crop me"
                  src={rawImageSrc}
                  style={{ maxHeight: '50vh', objectFit: 'contain' }}
                />
              </ReactCrop>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setCropModalOpen(false)}
                className="btn bg-slate-700 hover:bg-slate-600 text-white"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={handleConfirmCrop}
                className="btn btn-primary"
                disabled={!completedCrop?.width || !completedCrop?.height}
              >
                Kırp ve Ekle
              </button>
            </div>
          </div>
        </div>
      )}

      {previewLightbox && (
        <div
          className="fixed inset-0 z-[110] bg-black/90 flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setPreviewLightbox(null)}
        >
          <img
            src={previewLightbox}
            alt="Tam Ekran Görsel"
            className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl"
          />
        </div>
      )}

      <div>
        <label className="label">Stok Ekle (Beden / Yaş Seçimi)</label>
        <div className="flex flex-wrap gap-3 mt-2">
          {ALL_SIZES.map((size) => {
            const count = formData.inventory[size] || 0;
            const hasStock = count > 0;

            return (
              <div
                key={size}
                className={`flex items-center overflow-hidden rounded-xl border transition-colors ${
                  hasStock
                    ? 'border-blue-500 bg-slate-800'
                    : 'border-slate-600 bg-slate-700'
                }`}
              >
                <div
                  className={`px-3 py-2 text-sm font-bold cursor-pointer transition-colors ${
                    hasStock
                      ? 'text-blue-400'
                      : 'text-slate-300 hover:text-white'
                  }`}
                  onClick={() => {
                    if (!hasStock) adjustSizeStock(size, 1);
                  }}
                >
                  {size}
                </div>

                {hasStock && (
                  <div className="flex items-center bg-slate-900">
                    <button
                      type="button"
                      onClick={() => adjustSizeStock(size, -1)}
                      className="px-3 py-2 text-red-400 text-xl hover:bg-slate-800 font-black transition-colors"
                    >
                      -
                    </button>
                    <span className="text-slate-200 font-bold min-w-[1.5rem] text-center">
                      {count}
                    </span>
                    <button
                      type="button"
                      onClick={() => adjustSizeStock(size, 1)}
                      className="px-3 py-2 text-green-400 text-xl hover:bg-slate-800 font-black transition-colors"
                    >
                      +
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {Object.keys(formData.inventory).length === 0 && (
          <p className="text-red-500 text-sm mt-3">
            Lütfen en az bir beden için stok girin.
          </p>
        )}
      </div>

      <div className="pt-4 flex justify-end">
        <button
          type="submit"
          className="btn btn-primary"
          disabled={Object.keys(formData.inventory).length === 0}
        >
          {initialData ? 'Değişiklikleri Kaydet' : 'Ürünü Kaydet'}
        </button>
      </div>
    </form>
  );
}

export default function Products() {
  const { products, addProduct, deleteProduct, updateProduct, loading } =
    useStore();
  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Tümü');
  const [stockFilter, setStockFilter] = useState('Tümü');
  const [priceSort, setPriceSort] = useState('Varsayılan');

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setEditingProduct(null);
  };

  const handleFormSubmit = (productPayload) => {
    if (editingProduct) {
      updateProduct({ ...productPayload, id: editingProduct.id });
    } else {
      addProduct(productPayload);
    }
    handleCloseForm();
  };

  const filteredProducts = products
    .filter((product) => {
      const matchesSearch = product.title
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesCategory =
        categoryFilter === 'Tümü' || product.category === categoryFilter;
      const totalStock = Object.values(product.inventory || {}).reduce(
        (sum, qty) => sum + qty,
        0
      );
      const matchesStock =
        stockFilter === 'Tümü'
          ? true
          : stockFilter === 'Stokta Var'
          ? totalStock > 0
          : totalStock === 0;

      return matchesSearch && matchesCategory && matchesStock;
    })
    .sort((a, b) =>
      priceSort === 'Fiyat Artan'
        ? a.price - b.price
        : priceSort === 'Fiyat Azalan'
        ? b.price - a.price
        : 0
    );

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-black text-slate-100">Ürün Yönetimi</h1>

        <button
          onClick={() => (formOpen ? handleCloseForm() : setFormOpen(true))}
          className="btn btn-primary gap-2"
        >
          {formOpen ? (
            'İptal'
          ) : (
            <>
              <Plus size={20} /> Yeni Ürün Ekle
            </>
          )}
        </button>
      </div>

      {formOpen && (
        <div className="mb-12 card p-8 rounded-3xl shadow-md border border-slate-700">
          <h2 className="text-xl font-bold mb-6 text-slate-100">
            {editingProduct ? 'Ürünü Düzenle' : 'Yeni Ürün Ekle'}
          </h2>
          <ProductForm
            initialData={editingProduct}
            onSubmit={handleFormSubmit}
          />
        </div>
      )}

      <div className="bg-slate-50 p-5 rounded-3xl shadow-sm border border-border-color mb-6 transition-colors">
        <div className="flex flex-col xl:flex-row gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Ürün ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10 w-full"
            />
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter size={18} className="text-slate-400" />
              </div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="input-field pl-10 cursor-pointer appearance-none md:w-48 xl:w-40 card"
              >
                <option value="Tümü">Tüm Kategoriler</option>
                <option value="Elbise">Elbise</option>
                <option value="Tişört">Tişört</option>
                <option value="Pantolon">Pantolon</option>
                <option value="Takım">Takım</option>
                <option value="Aksesuar">Aksesuar</option>
              </select>
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Box size={18} className="text-slate-400" />
              </div>
              <select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value)}
                className="input-field pl-10 cursor-pointer appearance-none md:w-48 xl:w-40 card"
              >
                <option value="Tümü">Stok Durumu: Tümü</option>
                <option value="Stokta Var">Stokta Var</option>
                <option value="Tükendi">Tükendi</option>
              </select>
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <ArrowUpDown size={18} className="text-slate-400" />
              </div>
              <select
                value={priceSort}
                onChange={(e) => setPriceSort(e.target.value)}
                className="input-field pl-10 cursor-pointer appearance-none md:w-48 xl:w-44 card"
              >
                <option value="Varsayılan">Sıralama: Varsayılan</option>
                <option value="Fiyat Artan">Fiyat: Artan</option>
                <option value="Fiyat Azalan">Fiyat: Azalan</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="card rounded-3xl shadow-sm border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 border-b border-slate-700 text-slate-400 text-sm uppercase tracking-wider">
                <th className="text-left p-4 text-xs font-bold text-slate-400 uppercase">
                  Ürün
                </th>
                <th className="text-left p-4 text-xs font-bold text-slate-400 uppercase">
                  Kategori
                </th>
                <th className="text-left p-4 text-xs font-bold text-slate-400 uppercase">
                  Cinsiyet
                </th>
                <th className="text-left p-4 text-xs font-bold text-slate-400 uppercase">
                  Fiyat
                </th>
                <th className="text-left p-4 text-xs font-bold text-slate-400 uppercase">
                  Yaşlar
                </th>
                <th className="text-right p-4 text-xs font-bold text-slate-400 uppercase">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-blue mx-auto mb-2" />
                    <p className="text-muted text-sm font-bold">
                      Veriler Yükleniyor...
                    </p>
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-muted">
                    Hiç ürün bulunamadı.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr
                    key={product.id}
                    className="border-b border-slate-700 hover:bg-slate-700/50 transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-4">
                        <img
                          src={
                            product.images && product.images.length > 0
                              ? product.images[0]
                              : product.imageUrl
                          }
                          alt={product.title}
                          className="w-16 h-16 object-cover rounded-xl"
                        />
                        <span className="font-bold text-slate-200">
                          {product.title}
                        </span>
                      </div>
                    </td>

                    <td className="p-4 border-t border-slate-700 font-semibold text-slate-200">
                      <span className="badge badge-pink">
                        {product.category}
                      </span>
                    </td>

                    <td className="p-4 border-t border-slate-700 font-semibold text-slate-200">
                      <span className="text-sm text-blue-400 bg-blue-900/30 px-2 py-1 rounded-md">
                        {product.gender || 'Unisex'}
                      </span>
                    </td>

                    <td className="p-4 border-t border-slate-700 font-bold text-slate-200">
                      {product.price} ₺
                    </td>

                    <td className="p-4 border-t border-slate-700 text-sm">
                      <div className="flex flex-wrap gap-2 max-w-xs">
                        {Object.entries(product.inventory || {}).map(
                          ([age, qty]) =>
                            qty > 0 ? (
                              <div
                                key={age}
                                className="flex items-center bg-slate-700 rounded-lg overflow-hidden border border-slate-600"
                              >
                                <span className="px-2 py-1 text-slate-200 font-bold">
                                  {age}
                                </span>
                                <div className="flex items-center bg-slate-800">
                                  <button
                                    onClick={() =>
                                      updateProduct({
                                        ...product,
                                        inventory: {
                                          ...product.inventory,
                                          [age]: Math.max(0, qty - 1)
                                        }
                                      })
                                    }
                                    className="px-2 py-1 text-red-400 text-xl hover:bg-slate-700 font-black transition-colors"
                                  >
                                    -
                                  </button>
                                  <span className="px-2 py-1 text-slate-300 min-w-[2rem] text-center">
                                    {qty}
                                  </span>
                                  <button
                                    onClick={() =>
                                      updateProduct({
                                        ...product,
                                        inventory: {
                                          ...product.inventory,
                                          [age]: qty + 1
                                        }
                                      })
                                    }
                                    className="px-2 py-1 text-green-400 text-xl hover:bg-slate-700 font-black transition-colors"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                            ) : null
                        )}
                      </div>
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(product)}
                          className="p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-700 rounded-lg transition-colors"
                        >
                          <SquarePen size={18} />
                        </button>
                        <button
                          onClick={() => deleteProduct(product.id)}
                          className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
