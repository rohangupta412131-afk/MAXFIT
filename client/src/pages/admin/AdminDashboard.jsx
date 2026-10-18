import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart3, 
  Package, 
  ShoppingBag, 
  Sparkles, 
  Tag, 
  AlertTriangle, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  Clock, 
  Search,
  RefreshCw,
  TrendingUp,
  SlidersHorizontal,
  Layers,
  Boxes,
  X,
  ExternalLink,
  Save,
  Minus,
  Upload,
  Info,
  Image
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../config/api';

export const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'products' | 'inventory' | 'orders' | 'coupons'
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  // Products state
  const [products, setProducts] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('');
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [savingProduct, setSavingProduct] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = React.useRef(null);

  // Form state for Add / Edit product
  const [productForm, setProductForm] = useState({
    name: '',
    slug: '',
    description: '',
    price: '',
    mrp: '',
    category_id: '',
    fabric: '100% Cotton',
    care_instructions: 'Machine wash cold with like colors, tumble dry low.',
    garment_image: '',
    garment_des: '',
    tryon_enabled: true,
    variants: []
  });

  // Dedicated Quick Stock Editor Modal
  const [editingStockProduct, setEditingStockProduct] = useState(null);
  const [quickStockVariants, setQuickStockVariants] = useState([]);
  const [savingStock, setSavingStock] = useState(false);

  // Inventory tab filter
  const [inventoryStockFilter, setInventoryStockFilter] = useState('all'); // 'all' | 'low' | 'out'
  const [inventorySearch, setInventorySearch] = useState('');

  // Orders state
  const [orders, setOrders] = useState([]);
  const [orderStatusFilter, setOrderStatusFilter] = useState('');

  // Coupons state
  const [coupons, setCoupons] = useState([]);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [couponForm, setCouponForm] = useState({
    code: '',
    type: 'percent',
    value: '',
    min_order: '499',
    max_discount: '500'
  });

  const [categories, setCategories] = useState([]);

  const fetchMetrics = async () => {
    try {
      const res = await api.get('/admin/metrics');
      if (res.success) setMetrics(res.data);
    } catch (err) {
      console.warn('Metrics load error:', err);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await api.get('/admin/products');
      if (res.success) setProducts(res.data || []);
    } catch (err) {
      console.warn('Admin products load error:', err);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await api.get(`/admin/orders${orderStatusFilter ? `?status=${orderStatusFilter}` : ''}`);
      if (res.success) setOrders(res.data || []);
    } catch (err) {
      console.warn('Admin orders load error:', err);
    }
  };

  const fetchCoupons = async () => {
    try {
      const res = await api.get('/admin/coupons');
      if (res.success) setCoupons(res.data || []);
    } catch (err) {
      console.warn('Admin coupons load error:', err);
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchMetrics(), fetchProducts(), fetchOrders(), fetchCoupons(), api.get('/categories')])
      .then(([m, p, o, c, catRes]) => {
        if (catRes.data) setCategories(catRes.data);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (activeTab === 'orders') fetchOrders();
  }, [orderStatusFilter, activeTab]);

  // Helper to determine if a category is pants/bottoms
  const isBottomCategory = (cat) => {
    if (!cat) return false;
    const slug = (cat.slug || '').toLowerCase();
    const name = (cat.name || '').toLowerCase();
    return cat.size_type === 'bottom' || 
      ['pants-jeans', 'cargo', 'pants', 'trousers', 'jeans'].includes(slug) ||
      name.includes('pant') || name.includes('cargo') || name.includes('jean') || name.includes('trouser');
  };

  // Open modal for Adding new product
  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    const defaultCat = categories[0] || {};
    const isBottom = isBottomCategory(defaultCat);
    const defaultSizes = isBottom ? ['28', '30', '32', '34', '36', '38'] : ['S', 'M', 'L', 'XL', 'XXL'];
    setProductForm({
      name: '',
      slug: '',
      description: '',
      price: '',
      mrp: '',
      category_id: defaultCat?.id || '',
      fabric: '100% Cotton',
      care_instructions: 'Machine wash cold with like colors, tumble dry low.',
      garment_image: '',
      garment_des: '',
      tryon_enabled: !isBottom, // Default disabled for pants, enabled for shirts
      variants: defaultSizes.map(s => ({ size: s, color: 'Standard', stock: 10 }))
    });
    setShowProductModal(true);
  };

  // Open modal for Editing existing product
  const handleOpenEditProduct = (p) => {
    setEditingProduct(p);
    const cat = categories.find(c => c.id === (p.category_id || p.category?.id));
    const isBottom = isBottomCategory(cat);
    const defaultSizes = isBottom ? ['28', '30', '32', '34', '36', '38'] : ['S', 'M', 'L', 'XL', 'XXL'];
    const existingVariants = (p.variants || []).map(v => ({
      id: v.id,
      size: v.size,
      color: v.color || 'Standard',
      stock: v.stock
    }));

    setProductForm({
      name: p.name || '',
      slug: p.slug || '',
      description: p.description || '',
      price: p.price || '',
      mrp: p.mrp || '',
      category_id: p.category_id || p.category?.id || categories[0]?.id || '',
      fabric: p.fabric || '100% Cotton',
      care_instructions: p.care_instructions || 'Machine wash cold.',
      garment_image: p.garment_image || p.images?.[0] || '',
      garment_des: p.garment_des || '',
      tryon_enabled: p.tryon_enabled !== undefined ? p.tryon_enabled : !isBottom,
      variants: existingVariants.length > 0 ? existingVariants : defaultSizes.map(s => ({ size: s, color: 'Standard', stock: 10 }))
    });
    setShowProductModal(true);
  };

  // Handle category change in Add Product to adjust default sizes & tryon
  const handleCategoryChange = (newCatId) => {
    const selectedCat = categories.find(c => c.id === newCatId);
    const isBottom = isBottomCategory(selectedCat);
    const defaultSizes = isBottom 
      ? ['28', '30', '32', '34', '36', '38'] 
      : ['S', 'M', 'L', 'XL', 'XXL'];

    if (!editingProduct) {
      setProductForm(prev => ({
        ...prev,
        category_id: newCatId,
        tryon_enabled: !isBottom, // Disable try-on by default for pants, enable for shirts/tops
        variants: defaultSizes.map(s => ({ size: s, color: 'Standard', stock: 10 }))
      }));
    } else {
      const currentSizes = (productForm.variants || []).map(v => v.size);
      const isCurrentlyBottom = currentSizes.some(s => ['28', '30', '32', '34', '36', '38'].includes(s));
      const shouldSwitch = (isBottom && !isCurrentlyBottom) || (!isBottom && isCurrentlyBottom);

      setProductForm(prev => ({
        ...prev,
        category_id: newCatId,
        tryon_enabled: shouldSwitch ? !isBottom : prev.tryon_enabled,
        variants: shouldSwitch 
          ? defaultSizes.map(s => ({ size: s, color: 'Standard', stock: 10 }))
          : prev.variants
      }));
    }
  };

  // Handle file upload for garment image
  const handleImageFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size must be less than 10MB');
      return;
    }

    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append('image', file);
      const res = await api.upload('/admin/upload-image', formData);
      const uploadedUrl = res?.url || res?.data?.url;
      if (res?.success && uploadedUrl) {
        setProductForm(prev => ({
          ...prev,
          garment_image: uploadedUrl,
          garment_des: prev.garment_des || `${prev.name || 'Men garment'} catalogue photo`
        }));
        toast.success('Garment image uploaded to Supabase Storage!');
      } else {
        toast.error(res?.message || res?.error || 'Failed to upload image');
      }
    } catch (err) {
      toast.error(err.message || 'Image upload failed');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Save product (Add or Update)
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    try {
      if (!productForm.name.trim()) {
        toast.error('Product name is required');
        return;
      }
      if (!productForm.price || Number(productForm.price) <= 0) {
        toast.error('Valid selling price is required');
        return;
      }
      if (!productForm.category_id) {
        toast.error('Please select a category');
        return;
      }

      setSavingProduct(true);
      const payload = {
        ...productForm,
        price: Number(productForm.price),
        mrp: Number(productForm.mrp || productForm.price),
        images: [productForm.garment_image].filter(Boolean)
      };

      if (editingProduct) {
        await api.put(`/admin/products/${editingProduct.id}`, payload);
        toast.success('Product updated successfully!');
      } else {
        await api.post('/admin/products', payload);
        toast.success('Product created successfully!');
      }

      setShowProductModal(false);
      setEditingProduct(null);
      await fetchProducts();
      await fetchMetrics();
    } catch (err) {
      toast.error(err.message || 'Failed to save product');
    } finally {
      setSavingProduct(false);
    }
  };

  // Delete product
  const handleDeleteProduct = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"? This will remove all variants and stock.`)) return;
    try {
      await api.delete(`/admin/products/${id}`);
      setProducts(prev => prev.filter(p => p.id !== id));
      toast.success('Product deleted');
      await fetchMetrics();
    } catch (err) {
      toast.error(err.message || 'Failed to delete product');
    }
  };

  // Open quick stock editor for a product
  const handleOpenStockEditor = (p) => {
    setEditingStockProduct(p);
    setQuickStockVariants((p.variants || []).map(v => ({ ...v })));
  };

  // Save quick stock editor
  const handleSaveQuickStock = async () => {
    try {
      setSavingStock(true);
      for (const v of quickStockVariants) {
        await api.patch(`/admin/variants/${v.id}/stock`, { stock: v.stock });
      }
      toast.success(`Stock updated for ${editingStockProduct.name}`);
      setEditingStockProduct(null);
      await fetchProducts();
      await fetchMetrics();
    } catch (err) {
      toast.error(err.message || 'Failed to update stock');
    } finally {
      setSavingStock(false);
    }
  };

  // Inline single variant stock update
  const handleSingleVariantStockUpdate = async (variantId, newStock) => {
    try {
      const stockNum = Math.max(0, parseInt(newStock, 10) || 0);
      await api.patch(`/admin/variants/${variantId}/stock`, { stock: stockNum });
      toast.success('Stock updated');
      await fetchProducts();
      await fetchMetrics();
    } catch (err) {
      toast.error(err.message || 'Failed to update stock');
    }
  };

  // Order status update
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await api.patch(`/admin/orders/${orderId}/status`, { status: newStatus });
      toast.success(`Order status changed to ${newStatus}`);
      await fetchOrders();
      await fetchMetrics();
    } catch (err) {
      toast.error(err.message || 'Failed to update order status');
    }
  };

  // Coupons
  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/coupons', {
        ...couponForm,
        value: Number(couponForm.value),
        min_order: Number(couponForm.min_order),
        max_discount: couponForm.max_discount ? Number(couponForm.max_discount) : null
      });
      toast.success('Coupon created successfully');
      setShowCouponModal(false);
      setCouponForm({ code: '', type: 'percent', value: '', min_order: '499', max_discount: '500' });
      await fetchCoupons();
    } catch (err) {
      toast.error(err.message || 'Failed to create coupon');
    }
  };

  const handleDeleteCoupon = async (id) => {
    if (!window.confirm('Delete this coupon?')) return;
    try {
      await api.delete(`/admin/coupons/${id}`);
      setCoupons(prev => prev.filter(c => c.id !== id));
      toast.success('Coupon removed');
    } catch (err) {
      toast.error('Failed to delete coupon');
    }
  };

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchSearch = !productSearch || p.name.toLowerCase().includes(productSearch.toLowerCase()) || p.slug.includes(productSearch.toLowerCase());
      const matchCategory = !productCategoryFilter || p.category_id === productCategoryFilter || p.category?.slug === productCategoryFilter;
      return matchSearch && matchCategory;
    });
  }, [products, productSearch, productCategoryFilter]);

  // All variants flattened for Inventory tab
  const allVariantsList = useMemo(() => {
    const list = [];
    products.forEach(p => {
      (p.variants || []).forEach(v => {
        list.push({
          ...v,
          product_name: p.name,
          product_slug: p.slug,
          category_name: p.category?.name || 'Men',
          price: p.price,
          image: p.garment_image || p.images?.[0]
        });
      });
    });
    return list;
  }, [products]);

  const filteredInventory = useMemo(() => {
    return allVariantsList.filter(v => {
      const matchSearch = !inventorySearch || 
        v.product_name.toLowerCase().includes(inventorySearch.toLowerCase()) || 
        v.sku?.toLowerCase().includes(inventorySearch.toLowerCase());
      
      if (!matchSearch) return false;
      if (inventoryStockFilter === 'low') return v.stock > 0 && v.stock <= 5;
      if (inventoryStockFilter === 'out') return v.stock === 0;
      return true;
    });
  }, [allVariantsList, inventorySearch, inventoryStockFilter]);

  const totalVariantUnits = useMemo(() => {
    return allVariantsList.reduce((sum, v) => sum + (v.stock || 0), 0);
  }, [allVariantsList]);

  const totalLowStockVariants = useMemo(() => {
    return allVariantsList.filter(v => v.stock <= 5).length;
  }, [allVariantsList]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Admin Header & Tabs */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
            MAX-FIT Admin Console
          </span>
          <h1 className="font-['Syne'] text-3xl font-black text-neutral-950 mt-1">
            Store & Studio Analytics
          </h1>
        </div>

        <div className="flex flex-wrap gap-2 bg-stone-100 p-1.5 rounded-2xl border border-stone-200 text-xs font-bold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-xl transition ${activeTab === 'overview' ? 'bg-white text-neutral-950 shadow-sm' : 'text-stone-600 hover:text-neutral-950'}`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`px-4 py-2 rounded-xl transition ${activeTab === 'products' ? 'bg-white text-neutral-950 shadow-sm' : 'text-stone-600 hover:text-neutral-950'}`}
          >
            Products ({products.length})
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${activeTab === 'inventory' ? 'bg-white text-neutral-950 shadow-sm' : 'text-stone-600 hover:text-neutral-950'}`}
          >
            <span>Inventory</span>
            {totalLowStockVariants > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 rounded-xl transition ${activeTab === 'orders' ? 'bg-white text-neutral-950 shadow-sm' : 'text-stone-600 hover:text-neutral-950'}`}
          >
            Orders ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('coupons')}
            className={`px-4 py-2 rounded-xl transition ${activeTab === 'coupons' ? 'bg-white text-neutral-950 shadow-sm' : 'text-stone-600 hover:text-neutral-950'}`}
          >
            Coupons ({coupons.length})
          </button>
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && metrics && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* 4 Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-sm space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-400">Total Revenue</span>
              <div className="text-3xl font-black font-['Syne'] text-neutral-950">
                ₹{metrics.totalRevenue.toLocaleString('en-IN')}
              </div>
              <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" /> Razorpay Test Payments
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-sm space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-400">Total Stock</span>
              <div className="text-3xl font-black font-['Syne'] text-neutral-950">
                {totalVariantUnits} <span className="text-xs font-normal text-stone-500">units</span>
              </div>
              <p className="text-[11px] text-stone-500">{allVariantsList.length} active variants</p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-sm space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-400">Pending Orders</span>
              <div className="text-3xl font-black font-['Syne'] text-amber-600">
                {metrics.pendingOrders}
              </div>
              <p className="text-[11px] text-amber-600 font-semibold">User can retry payment</p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-sm space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-400">AI Try-On Success</span>
              <div className="text-3xl font-black font-['Syne'] text-neutral-950">
                {metrics.tryonAnalytics?.successRate || '100%'}
              </div>
              <p className="text-[11px] text-stone-500">{metrics.tryonAnalytics?.totalJobs || 0} total diffusion runs</p>
            </div>
          </div>

          {/* Low Stock Alerts */}
          <div className="bg-white rounded-3xl border border-stone-200/80 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-['Syne'] text-base font-bold text-neutral-950 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>Low Stock Watchlist (&le; 5 units)</span>
              </h3>
              <button
                onClick={() => {
                  setInventoryStockFilter('low');
                  setActiveTab('inventory');
                }}
                className="text-xs font-bold text-stone-600 hover:text-neutral-950 underline"
              >
                View all in Inventory
              </button>
            </div>

            {metrics.lowStockAlerts?.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {metrics.lowStockAlerts.map((v) => (
                  <div key={v.id} className="p-4 bg-stone-50 border border-stone-200 rounded-2xl flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-neutral-950">{v.product?.name || 'Garment'}</p>
                      <p className="text-[11px] text-stone-500">
                        Size: <strong>{v.size}</strong> • Color: {v.color}
                      </p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-xl text-xs font-black ${
                      v.stock === 0 ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {v.stock === 0 ? 'Sold Out' : `${v.stock} left`}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-stone-500">All inventory variants are well-stocked above thresholds.</p>
            )}
          </div>
        </div>
      )}

      {/* Products Tab */}
      {activeTab === 'products' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="font-['Syne'] text-lg font-bold text-neutral-950">Catalogue Products ({filteredProducts.length})</h3>
              <p className="text-xs text-stone-500">Create, edit prices, update garments, or manage variant inventory.</p>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              {/* Category Filter */}
              <select
                value={productCategoryFilter}
                onChange={(e) => setProductCategoryFilter(e.target.value)}
                className="bg-white text-xs font-bold text-neutral-950 border border-stone-200 rounded-xl px-3 py-2"
              >
                <option value="">All Categories</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              {/* Add Product Button */}
              <button
                onClick={handleOpenAddProduct}
                className="px-4 py-2 bg-neutral-950 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition whitespace-nowrap"
              >
                <Plus className="w-4 h-4 text-amber-400" />
                <span>Add Product</span>
              </button>
            </div>
          </div>

          {/* Search box */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search products by title or slug..."
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              className="w-full text-xs bg-white border border-stone-200 rounded-2xl pl-10 pr-4 py-2.5 shadow-sm focus:outline-none focus:border-neutral-900"
            />
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3 pointer-events-none" />
          </div>

          <div className="bg-white rounded-3xl border border-stone-200/80 overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-100 text-neutral-950 font-bold uppercase tracking-wider border-b border-stone-200">
                <tr>
                  <th className="py-3 px-4">Garment</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Price / MRP</th>
                  <th className="py-3 px-4">Stock Breakdown</th>
                  <th className="py-3 px-4">Try-On</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredProducts.map((p) => {
                  const totalStock = (p.variants || []).reduce((sum, v) => sum + v.stock, 0);
                  const isSoldOut = totalStock === 0;
                  const isLow = totalStock > 0 && totalStock <= 10;

                  return (
                    <tr key={p.id} className="hover:bg-stone-50 transition">
                      <td className="py-3 px-4 flex items-center gap-3">
                        <img
                          src={p.garment_image || p.images?.[0]}
                          alt=""
                          className="w-12 h-14 object-cover rounded-xl bg-stone-100 border border-stone-200 shrink-0"
                        />
                        <div>
                          <p className="font-bold text-neutral-950 text-xs">{p.name}</p>
                          <p className="text-[10px] text-stone-400 font-mono mt-0.5">{p.slug}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-stone-600 font-semibold">{p.category?.name || '-'}</td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-neutral-950">₹{p.price}</span>
                        <span className="text-stone-400 line-through ml-1.5">₹{p.mrp}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            isSoldOut ? 'bg-rose-100 text-rose-800' : isLow ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {isSoldOut ? 'Sold Out' : `${totalStock} in stock`}
                          </span>
                          <button
                            onClick={() => handleOpenStockEditor(p)}
                            className="text-[10px] text-indigo-600 font-bold hover:underline"
                          >
                            Edit ({p.variants?.length || 0})
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {p.variants?.slice(0, 5).map(v => (
                            <span key={v.id} className="text-[9px] bg-stone-100 text-stone-700 px-1.5 py-0.5 rounded font-mono">
                              {v.size}:{v.stock}
                            </span>
                          ))}
                          {p.variants?.length > 5 && (
                            <span className="text-[9px] text-stone-400">+{p.variants.length - 5}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {p.tryon_enabled ? (
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-extrabold text-[10px]">
                            ACTIVE
                          </span>
                        ) : (
                          <span className="text-stone-400 text-[10px]">Disabled</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenStockEditor(p)}
                            className="p-1.5 text-stone-500 hover:text-indigo-600 hover:bg-stone-100 rounded-lg transition"
                            title="Quick Stock Editor"
                          >
                            <Boxes className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEditProduct(p)}
                            className="p-1.5 text-stone-500 hover:text-neutral-950 hover:bg-stone-100 rounded-lg transition"
                            title="Edit Product Details"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p.id, p.name)}
                            className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Delete Product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Inventory & Stock Management Tab */}
      {activeTab === 'inventory' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="font-['Syne'] text-lg font-bold text-neutral-950">Variant Stock Management</h3>
              <p className="text-xs text-stone-500">
                Directly adjust per-size stock counts for every garment in your catalogue.
              </p>
            </div>

            <div className="flex gap-2 bg-stone-100 p-1 rounded-xl text-xs font-bold border border-stone-200">
              <button
                onClick={() => setInventoryStockFilter('all')}
                className={`px-3 py-1.5 rounded-lg transition ${inventoryStockFilter === 'all' ? 'bg-white text-neutral-950 shadow-sm' : 'text-stone-600'}`}
              >
                All Variants ({allVariantsList.length})
              </button>
              <button
                onClick={() => setInventoryStockFilter('low')}
                className={`px-3 py-1.5 rounded-lg transition text-amber-700 ${inventoryStockFilter === 'low' ? 'bg-white shadow-sm font-black' : ''}`}
              >
                Low Stock (&le; 5)
              </button>
              <button
                onClick={() => setInventoryStockFilter('out')}
                className={`px-3 py-1.5 rounded-lg transition text-rose-700 ${inventoryStockFilter === 'out' ? 'bg-white shadow-sm font-black' : ''}`}
              >
                Out of Stock (0)
              </button>
            </div>
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="Search by product name or SKU..."
              value={inventorySearch}
              onChange={(e) => setInventorySearch(e.target.value)}
              className="w-full text-xs bg-white border border-stone-200 rounded-2xl pl-10 pr-4 py-2.5 shadow-sm focus:outline-none focus:border-neutral-900"
            />
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3 pointer-events-none" />
          </div>

          <div className="bg-white rounded-3xl border border-stone-200/80 overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-100 text-neutral-950 font-bold uppercase tracking-wider border-b border-stone-200">
                <tr>
                  <th className="py-3 px-4">Garment</th>
                  <th className="py-3 px-4">Size & Color</th>
                  <th className="py-3 px-4">SKU</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Stock Quantity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredInventory.map((v) => (
                  <tr key={v.id} className="hover:bg-stone-50 transition">
                    <td className="py-3 px-4 flex items-center gap-3">
                      <img
                        src={v.image}
                        alt=""
                        className="w-10 h-12 object-cover rounded-lg bg-stone-100 border border-stone-200 shrink-0"
                      />
                      <div>
                        <p className="font-bold text-neutral-950">{v.product_name}</p>
                        <span className="text-[10px] text-stone-400">{v.category_name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-black text-xs text-neutral-950 bg-stone-100 px-2.5 py-1 rounded-lg">
                        {v.size}
                      </span>
                      <span className="text-stone-500 ml-2">{v.color}</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-stone-500">{v.sku || '-'}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        v.stock === 0 ? 'bg-rose-100 text-rose-800' : v.stock <= 5 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {v.stock === 0 ? 'Sold Out' : v.stock <= 5 ? 'Low Stock' : 'In Stock'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleSingleVariantStockUpdate(v.id, Math.max(0, v.stock - 1))}
                          className="w-7 h-7 bg-stone-100 hover:bg-stone-200 rounded-lg flex items-center justify-center font-bold text-stone-700 transition"
                          title="Decrease 1"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <input
                          type="number"
                          min="0"
                          defaultValue={v.stock}
                          key={v.id + '-' + v.stock}
                          onBlur={(e) => {
                            const val = parseInt(e.target.value, 10);
                            if (!isNaN(val) && val !== v.stock) {
                              handleSingleVariantStockUpdate(v.id, val);
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const val = parseInt(e.target.value, 10);
                              if (!isNaN(val) && val !== v.stock) {
                                handleSingleVariantStockUpdate(v.id, val);
                              }
                            }
                          }}
                          className="w-16 text-center font-bold font-mono text-xs bg-white border border-stone-300 rounded-lg py-1 focus:outline-none focus:border-neutral-950"
                        />
                        <button
                          onClick={() => handleSingleVariantStockUpdate(v.id, v.stock + 1)}
                          className="w-7 h-7 bg-stone-100 hover:bg-stone-200 rounded-lg flex items-center justify-center font-bold text-stone-700 transition"
                          title="Increase 1"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-['Syne'] text-lg font-bold text-neutral-950">Customer Orders ({orders.length})</h3>
              <p className="text-xs text-stone-500">Live order state management and tracking fulfillment.</p>
            </div>
            <select
              value={orderStatusFilter}
              onChange={(e) => setOrderStatusFilter(e.target.value)}
              className="bg-white text-xs font-bold text-neutral-950 border border-stone-200 rounded-xl px-3 py-2 shadow-sm"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending (Awaiting Payment)</option>
              <option value="paid">Paid</option>
              <option value="processing">Ready to be Shipped (Processing)</option>
              <option value="shipped">In Transit (Shipped)</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="bg-white rounded-3xl border border-stone-200/80 overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-100 text-neutral-950 font-bold uppercase tracking-wider border-b border-stone-200">
                <tr>
                  <th className="py-3 px-4">Order Ref</th>
                  <th className="py-3 px-4">Customer & Shipping</th>
                  <th className="py-3 px-4">Items Summary</th>
                  <th className="py-3 px-4">Total</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Change Delivery Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-stone-50 transition">
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-neutral-950 block">{o.order_number}</span>
                      <span className="text-[10px] text-stone-400">
                        {new Date(o.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-neutral-950">{o.shipping_address?.name || 'Customer'}</p>
                      <p className="text-[10px] text-stone-400">{o.shipping_address?.city}, {o.shipping_address?.state} - {o.shipping_address?.pincode}</p>
                      <p className="text-[10px] text-stone-500">{o.shipping_address?.phone}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-stone-700">{o.items?.length || 0} item(s)</p>
                      <span className="text-[10px] text-stone-400 truncate block max-w-[160px]">
                        {o.items?.map(i => i.product_name).join(', ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-black font-['Syne'] text-neutral-950 text-sm">
                      ₹{Number(o.total).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                        o.status === 'delivered' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                        o.status === 'shipped' ? 'bg-purple-100 text-purple-800 border-purple-200' :
                        o.status === 'processing' || o.status === 'paid' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                        o.status === 'pending' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                        'bg-rose-100 text-rose-800 border-rose-200'
                      }`}>
                        {o.status === 'processing' ? 'Ready to Ship' : o.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <select
                        value={o.status}
                        onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}
                        className="bg-stone-50 border border-stone-300 rounded-xl px-2.5 py-1.5 text-xs font-bold text-neutral-950 focus:outline-none focus:border-neutral-950"
                      >
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                        <option value="processing">Ready to be Shipped</option>
                        <option value="shipped">In Transit (Shipped)</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Coupons Tab */}
      {activeTab === 'coupons' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex justify-between items-center">
            <h3 className="font-['Syne'] text-lg font-bold text-neutral-950">Active Promo Coupons</h3>
            <button
              onClick={() => setShowCouponModal(true)}
              className="px-4 py-2 bg-neutral-950 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4 text-amber-400" />
              <span>Create Coupon</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {coupons.map((c) => (
              <div key={c.id} className="p-5 bg-white rounded-3xl border border-stone-200/80 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-base font-black text-neutral-950 bg-stone-100 px-3 py-1 rounded-xl">
                      {c.code}
                    </span>
                    <button
                      onClick={() => handleDeleteCoupon(c.id)}
                      className="p-1.5 text-stone-400 hover:text-rose-600 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs font-bold text-stone-700 mt-3">
                    {c.type === 'percent' ? `${c.value}% OFF` : `Flat ₹${c.value} OFF`}
                  </p>
                  <p className="text-[11px] text-stone-500 mt-0.5">Min Order: ₹{c.min_order}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ADD / EDIT PRODUCT MODAL */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-stone-200 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-200 pb-4 mb-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-stone-400">Catalogue Management</span>
                <h3 className="font-['Syne'] text-xl font-bold text-neutral-950">
                  {editingProduct ? `Edit: ${editingProduct.name}` : 'Add New Men’s Garment'}
                </h3>
              </div>
              <button
                onClick={() => setShowProductModal(false)}
                className="p-2 text-stone-400 hover:text-neutral-950 rounded-full hover:bg-stone-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              {/* Product Name */}
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">Product Title</label>
                <input
                  type="text"
                  placeholder="e.g. Vintage Wash Heavyweight Relaxed Denim Jacket"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  className="w-full text-xs bg-stone-50 border border-stone-300 rounded-xl p-3 font-semibold focus:outline-none focus:border-neutral-950"
                  required
                />
              </div>

              {/* Slug and Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">URL Slug</label>
                  <input
                    type="text"
                    placeholder="auto-derived-from-name"
                    value={productForm.slug}
                    onChange={(e) => setProductForm({ ...productForm, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
                    className="w-full text-xs bg-stone-50 border border-stone-300 rounded-xl p-3 font-mono focus:outline-none focus:border-neutral-950"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">Men's Category</label>
                  <select
                    value={productForm.category_id}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="w-full text-xs bg-stone-50 border border-stone-300 rounded-xl p-3 font-semibold focus:outline-none focus:border-neutral-950"
                    required
                  >
                    {categories.map((cat) => {
                      const isCatBottom = isBottomCategory(cat);
                      return (
                        <option key={cat.id} value={cat.id}>
                          {cat.name} ({isCatBottom ? 'Pants / Bottom: Waist 28-38' : 'Shirt / Top: Chest S-XXL'})
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              {/* Price and MRP */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">Selling Price (INR)</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 849"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    className="w-full text-xs bg-stone-50 border border-stone-300 rounded-xl p-3 font-bold text-neutral-950 focus:outline-none focus:border-neutral-950"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">MRP Original (INR)</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 1499"
                    value={productForm.mrp}
                    onChange={(e) => setProductForm({ ...productForm, mrp: e.target.value })}
                    className="w-full text-xs bg-stone-50 border border-stone-300 rounded-xl p-3 font-bold text-stone-500 focus:outline-none focus:border-neutral-950"
                  />
                </div>
              </div>

              {/* Garment Image Upload & Resolution Guidelines */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-stone-700 block">
                    Garment Image & Photo Upload
                  </label>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                    Recommended: 3:4 Portrait Aspect Ratio
                  </span>
                </div>

                {/* Resolution & Quality Guidance Box */}
                <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-2xl text-xs space-y-2">
                  <div className="flex items-start gap-2.5">
                    <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-bold text-blue-950">
                        Image Resolution & Specification Guidelines:
                      </p>
                      <ul className="list-disc list-inside text-blue-900/90 text-[11px] space-y-0.5 pl-0.5 leading-relaxed">
                        <li><strong>Optimal Resolution:</strong> 768 × 1024 px minimum (Recommended: <strong>1200 × 1600 px</strong> or 1800 × 2400 px for crisp zoom).</li>
                        <li><strong>Aspect Ratio:</strong> Exactly <strong>3:4 Portrait</strong> for product showcase and IDM-VTON try-on canvas.</li>
                        <li><strong>Background:</strong> Clean solid white or light neutral studio background, flat-lay or ghost mannequin.</li>
                        <li><strong>File Formats:</strong> JPG, PNG, WEBP (Maximum size: 10MB).</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Upload Box / Action */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Upload File from computer */}
                  <div className="border-2 border-dashed border-stone-300 hover:border-neutral-950 rounded-2xl p-4 flex flex-col items-center justify-center text-center transition bg-white/50 group">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleImageFileUpload}
                      className="hidden"
                      id="garment-file-upload"
                    />
                    <label
                      htmlFor="garment-file-upload"
                      className="cursor-pointer flex flex-col items-center gap-2 w-full"
                    >
                      <div className="w-10 h-10 rounded-full bg-stone-100 group-hover:bg-neutral-950 group-hover:text-white flex items-center justify-center text-stone-700 transition">
                        {uploadingImage ? (
                          <RefreshCw className="w-5 h-5 animate-spin text-amber-500" />
                        ) : (
                          <Upload className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-neutral-950 group-hover:underline">
                          {uploadingImage ? 'Uploading Image to Storage...' : 'Upload from Computer'}
                        </span>
                        <p className="text-[10px] text-stone-400 mt-0.5">JPG, PNG, or WEBP up to 10MB</p>
                      </div>
                    </label>
                  </div>

                  {/* Direct Image URL or preview */}
                  <div className="bg-stone-50 rounded-2xl p-3 border border-stone-200 flex flex-col justify-between gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-1">
                        Direct URL or Storage Path
                      </label>
                      <input
                        type="text"
                        placeholder="https://... or /Products Image/..."
                        value={productForm.garment_image}
                        onChange={(e) => setProductForm({ ...productForm, garment_image: e.target.value })}
                        className="w-full text-xs bg-white border border-stone-300 rounded-xl p-2.5 focus:outline-none focus:border-neutral-950 font-mono"
                        required
                      />
                    </div>

                    {productForm.garment_image ? (
                      <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-stone-200">
                        <img
                          src={productForm.garment_image}
                          alt="Preview"
                          className="w-12 h-16 object-cover rounded-lg border border-stone-200 shrink-0 bg-stone-100"
                        />
                        <div className="overflow-hidden">
                          <span className="text-[11px] font-bold text-neutral-950 truncate block">
                            Image Selected
                          </span>
                          <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                            <Check className="w-3 h-3" /> Ready for catalogue & try-on
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-stone-400 text-xs py-1">
                        <Image className="w-4 h-4 shrink-0" />
                        <span className="text-[11px]">No image uploaded yet</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Fabric & Care */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">Fabric Composition</label>
                  <input
                    type="text"
                    placeholder="e.g. 100% Combed Cotton, 240 GSM"
                    value={productForm.fabric}
                    onChange={(e) => setProductForm({ ...productForm, fabric: e.target.value })}
                    className="w-full text-xs bg-stone-50 border border-stone-300 rounded-xl p-3 focus:outline-none focus:border-neutral-950"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">Care Instructions</label>
                  <input
                    type="text"
                    placeholder="e.g. Machine wash cold, dry flat"
                    value={productForm.care_instructions}
                    onChange={(e) => setProductForm({ ...productForm, care_instructions: e.target.value })}
                    className="w-full text-xs bg-stone-50 border border-stone-300 rounded-xl p-3 focus:outline-none focus:border-neutral-950"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">Description</label>
                <textarea
                  rows="3"
                  placeholder="Engineered with drop shoulder cut, heavy ribbed collar, and pre-shrunk wash..."
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  className="w-full text-xs bg-stone-50 border border-stone-300 rounded-xl p-3 focus:outline-none focus:border-neutral-950"
                ></textarea>
              </div>

              {/* Try-On Settings (Pants default disabled, shirts default enabled) */}
              {(() => {
                const selectedCat = categories.find(c => c.id === productForm.category_id);
                const isBottom = isBottomCategory(selectedCat);

                return (
                  <div className={`p-4 rounded-2xl border transition-all ${
                    isBottom 
                      ? 'bg-stone-50 border-stone-200' 
                      : 'bg-amber-50/60 border-amber-200/80'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="pr-4">
                        <span className={`text-xs font-bold flex items-center gap-1.5 ${
                          isBottom ? 'text-stone-800' : 'text-amber-950'
                        }`}>
                          <Sparkles className={`w-3.5 h-3.5 ${isBottom ? 'text-stone-400' : 'text-amber-500'}`} />
                          AI Virtual Try-On Studio {productForm.tryon_enabled ? 'Enabled' : 'Disabled'}
                        </span>
                        <p className="text-[11px] mt-1">
                          {isBottom ? (
                            <span className="text-stone-600 block">
                              ⚠️ <strong className="text-amber-900">Disabled by default for Pants / Bottoms:</strong> IDM-VTON diffusion try-on model is designed for upper garments (shirts, t-shirts, jackets). You can check the box to force enable if desired.
                            </span>
                          ) : (
                            <span className="text-amber-800 font-medium block">
                              ✨ <strong className="text-neutral-950">Enabled for Upper Garments:</strong> Allows customers to try on this shirt/jacket with AI Try-On Studio.
                            </span>
                          )}
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={productForm.tryon_enabled}
                        onChange={(e) => setProductForm({ ...productForm, tryon_enabled: e.target.checked })}
                        className="w-4 h-4 text-neutral-950 rounded border-stone-300 focus:ring-neutral-950 shrink-0"
                      />
                    </div>
                  </div>
                );
              })()}

              {/* Variant Stock Setting */}
              <div className="border border-stone-200 rounded-2xl p-4 bg-stone-50 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-stone-900 block">
                      Variant Sizes & Initial Stock
                    </label>
                    <span className="text-[11px] text-stone-500">
                      {(() => {
                        const cat = categories.find(c => c.id === productForm.category_id);
                        return isBottomCategory(cat)
                          ? '👖 Bottoms / Pants waist sizing (28, 30, 32, 34, 36, 38)'
                          : '👕 Tops / Shirts standard chest sizing (S, M, L, XL, XXL)';
                      })()}
                    </span>
                  </div>
                  <span className="text-[10px] uppercase font-mono font-bold bg-white border border-stone-200 px-2.5 py-1 rounded-lg text-stone-600">
                    {productForm.variants.length} Sizes
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {productForm.variants.map((v, idx) => (
                    <div key={v.id || v.size} className="bg-white p-2.5 rounded-xl border border-stone-200 flex items-center justify-between shadow-xs">
                      <span className="font-black text-xs text-neutral-950 bg-stone-100 px-2.5 py-1 rounded-lg">
                        {v.size}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-stone-400 font-medium">Stock:</span>
                        <input
                          type="number"
                          min="0"
                          value={v.stock}
                          onChange={(e) => {
                            const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                            const updated = [...productForm.variants];
                            updated[idx].stock = val;
                            setProductForm({ ...productForm, variants: updated });
                          }}
                          className="w-14 text-center font-bold text-xs bg-stone-50 border border-stone-300 rounded-lg py-1 focus:outline-none focus:border-neutral-950"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit / Cancel Buttons */}
              <div className="flex gap-3 pt-4 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="flex-1 py-3 border border-stone-300 rounded-2xl text-xs font-bold text-stone-700 hover:bg-stone-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProduct}
                  className="flex-1 py-3 bg-neutral-950 hover:bg-neutral-800 text-white rounded-2xl text-xs font-bold shadow-md transition"
                >
                  {savingProduct ? 'Saving...' : editingProduct ? 'Update Product' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK VARIANT STOCK MODAL */}
      {editingStockProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Quick Stock Editor</span>
                <h3 className="font-['Syne'] text-base font-bold text-neutral-950 truncate max-w-[280px]">
                  {editingStockProduct.name}
                </h3>
              </div>
              <button
                onClick={() => setEditingStockProduct(null)}
                className="p-1.5 text-stone-400 hover:text-neutral-950 rounded-full hover:bg-stone-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 max-h-[50vh] overflow-y-auto">
              {quickStockVariants.map((v, idx) => (
                <div key={v.id} className="p-3 bg-stone-50 rounded-2xl border border-stone-200 flex items-center justify-between">
                  <div>
                    <span className="font-black text-xs text-neutral-950 bg-white px-2.5 py-1 rounded-lg border border-stone-200">
                      {v.size}
                    </span>
                    <span className="text-xs text-stone-500 ml-2">{v.color || 'Standard'}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const updated = [...quickStockVariants];
                        updated[idx].stock = Math.max(0, updated[idx].stock - 1);
                        setQuickStockVariants(updated);
                      }}
                      className="w-7 h-7 bg-white border border-stone-300 rounded-lg flex items-center justify-center font-bold text-stone-700 hover:bg-stone-100"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <input
                      type="number"
                      min="0"
                      value={v.stock}
                      onChange={(e) => {
                        const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                        const updated = [...quickStockVariants];
                        updated[idx].stock = val;
                        setQuickStockVariants(updated);
                      }}
                      className="w-16 text-center font-bold font-mono text-xs bg-white border border-stone-300 rounded-lg py-1"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const updated = [...quickStockVariants];
                        updated[idx].stock = updated[idx].stock + 1;
                        setQuickStockVariants(updated);
                      }}
                      className="w-7 h-7 bg-white border border-stone-300 rounded-lg flex items-center justify-center font-bold text-stone-700 hover:bg-stone-100"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setEditingStockProduct(null)}
                className="flex-1 py-2.5 border border-stone-300 rounded-xl text-xs font-bold text-stone-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveQuickStock}
                disabled={savingStock}
                className="flex-1 py-2.5 bg-neutral-950 text-white rounded-xl text-xs font-bold shadow-md hover:bg-neutral-800"
              >
                {savingStock ? 'Saving...' : 'Save Stock'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Coupon Modal */}
      {showCouponModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-stone-200">
            <h3 className="font-['Syne'] text-base font-bold text-neutral-950 mb-4">Create Promotion Coupon</h3>
            <form onSubmit={handleCreateCoupon} className="space-y-3">
              <input
                type="text"
                placeholder="Coupon Code (e.g. SUMMER25)"
                value={couponForm.code}
                onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                className="w-full text-xs bg-stone-50 border border-stone-300 rounded-xl p-3 uppercase font-bold"
                required
              />
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={couponForm.type}
                  onChange={(e) => setCouponForm({ ...couponForm, type: e.target.value })}
                  className="text-xs bg-stone-50 border border-stone-300 rounded-xl p-3"
                >
                  <option value="percent">Percentage (%)</option>
                  <option value="flat">Flat (INR)</option>
                </select>
                <input
                  type="number"
                  placeholder="Discount Value"
                  value={couponForm.value}
                  onChange={(e) => setCouponForm({ ...couponForm, value: e.target.value })}
                  className="text-xs bg-stone-50 border border-stone-300 rounded-xl p-3"
                  required
                />
              </div>
              <input
                type="number"
                placeholder="Min Order Amount (INR)"
                value={couponForm.min_order}
                onChange={(e) => setCouponForm({ ...couponForm, min_order: e.target.value })}
                className="w-full text-xs bg-stone-50 border border-stone-300 rounded-xl p-3"
              />
              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCouponModal(false)}
                  className="flex-1 py-2.5 border border-stone-300 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-neutral-950 text-white rounded-xl text-xs font-bold"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
