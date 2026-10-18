import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, ChevronRight, FileText, ArrowRight } from 'lucide-react';
import { api } from '../config/api';

export const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/orders')
      .then(res => {
        if (res.success) setOrders(res.data || []);
      })
      .catch(err => console.warn('Orders fetch error:', err))
      .finally(() => setLoading(false));
  }, []);

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-amber-100 text-amber-800 border-amber-200',
      paid: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      processing: 'bg-blue-100 text-blue-800 border-blue-200',
      shipped: 'bg-purple-100 text-purple-800 border-purple-200',
      delivered: 'bg-green-100 text-green-800 border-green-200',
      cancelled: 'bg-rose-100 text-rose-800 border-rose-200',
      refunded: 'bg-stone-200 text-stone-800 border-stone-300'
    };
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${styles[status] || styles.pending}`}>
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 flex justify-center">
        <div className="w-8 h-8 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-stone-100 mx-auto flex items-center justify-center text-stone-400">
          <Package className="w-8 h-8" />
        </div>
        <h2 className="font-['Syne'] text-3xl font-black text-neutral-950">
          No Orders Yet
        </h2>
        <p className="text-stone-500 text-sm max-w-sm mx-auto">
          You haven't placed any orders yet. Discover our latest collection.
        </p>
        <Link
          to="/shop"
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-neutral-950 text-white font-bold text-xs uppercase tracking-wider hover:bg-neutral-800 transition shadow-lg"
        >
          <span>Explore Shop</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="border-b border-stone-200 pb-4">
        <h1 className="font-['Syne'] text-3xl font-black text-neutral-950">
          My Orders & Invoices ({orders.length})
        </h1>
      </div>

      <div className="space-y-4">
        {orders.map((order) => (
          <div
            key={order.id}
            className="p-6 bg-white rounded-3xl border border-stone-200/80 shadow-sm hover:border-neutral-900/30 transition flex flex-col md:flex-row gap-6 md:items-center justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="font-bold text-sm text-neutral-950 font-mono">
                  {order.order_number}
                </span>
                {getStatusBadge(order.status)}
              </div>

              <p className="text-xs text-stone-500">
                Placed on {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>

              {/* Items Preview */}
              <div className="flex gap-2 pt-2">
                {order.items?.slice(0, 3).map((item, idx) => (
                  <div key={idx} className="w-12 h-14 rounded-xl overflow-hidden bg-stone-100 border border-stone-200">
                    <img src={item.image} alt={item.product_name} className="w-full h-full object-cover" />
                  </div>
                ))}
                {order.items?.length > 3 && (
                  <div className="w-12 h-14 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center text-xs font-bold text-stone-500">
                    +{order.items.length - 3}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between md:justify-end gap-6 pt-4 md:pt-0 border-t md:border-0 border-stone-100">
              <div className="text-right">
                <span className="text-[10px] text-stone-400 block uppercase font-bold tracking-wider">Total</span>
                <span className="font-black font-['Syne'] text-lg text-neutral-950">
                  ₹{Number(order.total).toLocaleString('en-IN')}
                </span>
              </div>

              {order.status === 'pending' ? (
                <Link
                  to={`/orders/${order.id}`}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                >
                  <span>Complete Payment</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              ) : (
                <Link
                  to={`/orders/${order.id}`}
                  className="px-5 py-2.5 bg-neutral-950 text-white rounded-xl text-xs font-bold hover:bg-neutral-800 transition flex items-center gap-1.5 shadow-sm"
                >
                  <span>Order Details</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
