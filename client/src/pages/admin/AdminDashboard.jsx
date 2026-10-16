import React, { useState, useEffect } from 'react';
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
  TrendingUp
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../config/api';

export const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'products' | 'orders' | 'coupons'
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  // Products
  const [products, setProducts] = useState([]);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    name: '',
    slug: '',
    description: '',
    price: '',
    mrp: '',
    category_id: '',
    gender: 'unisex',
    fabric: '',
    care_instructions: '',
    garment_image: '',
    garment_des: '',
    tryon_enabled: true
  });

  // Orders
  const [orders, setOrders] = useState([]);
  const [orderStatusFilter, setOrderStatusFilter] = useState('');

  // Coupons
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

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await api.put(`/admin/products/${editingProduct.id}`, productForm);
        toast.success('Product updated');
      } else {
        await api.post('/admin/products', {
          ...productForm,
          price: Number(productForm.price),
          mrp: Number(productForm.mrp),
          images: [productForm.garment_image]
        });
        toast.success('Product created');
      }
      setShowProductModal(false);
      setEditingProduct(null);
      await fetchProducts();
    } catch (err) {
      toast.error(err.message || 'Failed to save product');
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await api.delete(`/admin/products/${id}`);
      setProducts(products.filter(p => p.id !== id));
      toast.success('Product deleted');
    } catch (err) {
      toast.error('Failed to delete product');
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await api.patch(`/admin/orders/${orderId}/status`, { status: newStatus });
      toast.success(`Order marked as ${newStatus}`);
      await fetchOrders();
      await fetchMetrics();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/coupons', {
        ...couponForm,
        value: Number(couponForm.value),
        min_order: Number(couponForm.min_order),
        max_discount: couponForm.max_discount ? Number(couponForm.max_discount) : null
      });
      toast.success('Coupon created');
      setShowCouponModal(false);
      setCouponForm({ code: '', type: 'percent', value: '', min_order: '499', max_discount: '500' });
      await fetchCoupons();
    } catch (err) {
      toast.error(err.message || 'Failed to create coupon');
    }
  };

  const handleDeleteCoupon = async (id) => {
    try {
      await api.delete(`/admin/coupons/${id}`);
      setCoupons(coupons.filter(c => c.id !== id));
      toast.success('Coupon removed');
    } catch (err) {
      toast.error('Failed to delete coupon');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Admin Header & Tabs */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
            Admin Console
          </span>
          <h1 className="font-['Syne'] text-3xl font-black text-neutral-950 mt-1">
            Store & Studio Analytics
          </h1>
        </div>

        <div className="flex gap-2 bg-stone-100 p-1.5 rounded-2xl border border-stone-200 text-xs font-bold">
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
                <TrendingUp className="w-3.5 h-3.5" /> Direct capture via Razorpay
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-sm space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-400">Orders Today</span>
              <div className="text-3xl font-black font-['Syne'] text-neutral-950">
                {metrics.ordersToday}
              </div>
              <p className="text-[11px] text-stone-500">Live order activity</p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-sm space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-400">Pending Checkout</span>
              <div className="text-3xl font-black font-['Syne'] text-neutral-950">
                {metrics.pendingOrders}
              </div>
              <p className="text-[11px] text-amber-600 font-semibold">Auto-expires in 30 min</p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-sm space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-400">AI Try-On Success</span>
              <div className="text-3xl font-black font-['Syne'] text-amber-600">
                {metrics.tryonAnalytics?.successRate || '100%'}
              </div>
              <p className="text-[11px] text-stone-500">{metrics.tryonAnalytics?.totalJobs || 0} total inference runs</p>
            </div>
          </div>

          {/* Sales Visual Chart & Low Stock Alerts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Sales Chart */}
            <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-stone-200/80 shadow-sm space-y-4">
              <h3 className="font-['Syne'] text-base font-bold text-neutral-950">
                Daily Sales (Last 7 Days)
              </h3>
              <div className="h-48 flex items-end gap-3 pt-6 px-2">
                {metrics.salesChart?.map((day) => {
                  const maxRev = Math.max(...metrics.salesChart.map(d => d.revenue), 1000);
                  const barHeight = Math.max(10, Math.round((day.revenue / maxRev) * 100));
                  return (
                    <div key={day.date} className="flex-1 flex flex-col items-center gap-2 group">
                      <div className="text-[10px] font-bold text-stone-600 opacity-0 group-hover:opacity-100 transition">
                        ₹{day.revenue}
                      </div>
                      <div
                        className="w-full bg-neutral-900 rounded-xl group-hover:bg-amber-400 transition-all duration-300"
                        style={{ height: `${barHeight}%` }}
                      ></div>
                      <span className="text-[10px] text-stone-400 font-mono">
                        {day.date.slice(5)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Low Stock Alerts */}
            <div className="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-sm space-y-4">
              <h3 className="font-['Syne'] text-base font-bold text-neutral-950 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>Low-Stock Alerts (&lt; 5)</span>
              </h3>

              <div className="space-y-2.5 max-h-60 overflow-y-auto">
                {metrics.lowStockAlerts?.length > 0 ? (
                  metrics.lowStockAlerts.map((v) => (
                    <div key={v.id} className="p-2.5 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-neutral-950">{v.product?.name}</p>
                        <p className="text-[11px] text-stone-500">Size: {v.size} • Color: {v.color}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-extrabold text-[10px]">
                        {v.stock} left
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-stone-400 py-4 text-center">All inventory stock healthy.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Products Tab */}
      {activeTab === 'products' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex justify-between items-center">
            <h3 className="font-['Syne'] text-lg font-bold text-neutral-950">Catalogue Inventory</h3>
            <button
              onClick={() => {
                setEditingProduct(null);
                setProductForm({
                  name: '',
                  slug: '',
                  description: '',
                  price: '',
                  mrp: '',
                  category_id: categories[0]?.id || '',
                  gender: 'unisex',
                  fabric: '',
                  care_instructions: '',
                  garment_image: '',
                  garment_des: '',
                  tryon_enabled: true
                });
                setShowProductModal(true);
              }}
              className="px-4 py-2 bg-neutral-950 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Product</span>
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-stone-200/80 overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-100 text-neutral-950 font-bold uppercase tracking-wider border-b border-stone-200">
                <tr>
                  <th className="py-3 px-4">Garment</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Price / MRP</th>
                  <th className="py-3 px-4">Variants / Stock</th>
                  <th className="py-3 px-4">Try-On</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {products.map((p) => {
                  const totalStock = p.variants?.reduce((sum, v) => sum + v.stock, 0) || 0;
                  return (
                    <tr key={p.id} className="hover:bg-stone-50 transition">
                      <td className="py-3 px-4 flex items-center gap-3">
                        <img
                          src={p.garment_image || p.images?.[0]}
                          alt=""
                          className="w-10 h-12 object-cover rounded-lg bg-stone-100 border border-stone-200"
                        />
                        <div>
                          <p className="font-bold text-neutral-950">{p.name}</p>
                          <p className="text-[10px] text-stone-400 font-mono">{p.slug}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-stone-600">{p.category?.name || '-'}</td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-neutral-950">₹{p.price}</span>
                        <span className="text-stone-400 line-through ml-1.5">₹{p.mrp}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-neutral-950">{p.variants?.length || 0} variants</span>
                        <span className="text-stone-500 block text-[11px]">{totalStock} units</span>
                      </td>
                      <td className="py-3 px-4">
                        {p.tryon_enabled ? (
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-extrabold text-[10px]">
                            ACTIVE
                          </span>
                        ) : (
                          <span className="text-stone-400">Disabled</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleDeleteProduct(p.id)}
                          className="p-1.5 text-stone-400 hover:text-rose-600 transition"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex justify-between items-center">
            <h3 className="font-['Syne'] text-lg font-bold text-neutral-950">Customer Orders</h3>
            <select
              value={orderStatusFilter}
              onChange={(e) => setOrderStatusFilter(e.target.value)}
              className="bg-stone-100 text-xs font-bold text-neutral-950 border border-stone-200 rounded-xl px-3 py-2"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="bg-white rounded-3xl border border-stone-200/80 overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-100 text-neutral-950 font-bold uppercase tracking-wider border-b border-stone-200">
                <tr>
                  <th className="py-3 px-4">Order Ref</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Total</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Update Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-stone-50 transition">
                    <td className="py-3 px-4 font-mono font-bold text-neutral-950">{o.order_number}</td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-neutral-950">{o.shipping_address?.name || 'Customer'}</p>
                      <p className="text-[10px] text-stone-400">{o.shipping_address?.city}, {o.shipping_address?.pincode}</p>
                    </td>
                    <td className="py-3 px-4 font-black font-['Syne'] text-neutral-950">₹{o.total}</td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-stone-100 border border-stone-200">
                        {o.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <select
                        value={o.status}
                        onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}
                        className="text-xs bg-stone-50 border border-stone-300 rounded-lg px-2 py-1 focus:outline-none"
                      >
                        <option value="pending">pending</option>
                        <option value="paid">paid</option>
                        <option value="processing">processing</option>
                        <option value="shipped">shipped</option>
                        <option value="delivered">delivered</option>
                        <option value="cancelled">cancelled</option>
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
              <Plus className="w-4 h-4" />
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
