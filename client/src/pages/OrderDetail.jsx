import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Download, ChevronLeft, MapPin, CreditCard, ShieldCheck, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../config/api';

export const OrderDetail = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/orders/${id}`);
      if (res.success) setOrder(res.data);
    } catch (err) {
      toast.error('Could not load order');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const handleDownloadInvoice = async () => {
    try {
      setDownloading(true);
      const res = await api.get(`/orders/${id}/invoice`);
      if (res.data?.downloadUrl) {
        window.open(res.data.downloadUrl, '_blank');
      }
    } catch (err) {
      toast.error(err.message || 'Invoice generation in progress, please retry');
    } finally {
      setDownloading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!window.confirm('Are you sure you want to cancel this order? Stock will be restored and your refund will be processed.')) {
      return;
    }

    try {
      setCancelling(true);
      const res = await api.post(`/orders/${id}/cancel`);
      toast.success(res.message);
      await fetchOrder();
    } catch (err) {
      toast.error(err.message || 'Failed to cancel order');
    } finally {
      setCancelling(false);
    }
  };

  if (loading || !order) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 flex justify-center">
        <div className="w-8 h-8 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const addr = order.shipping_address || {};
  const canCancel = ['paid', 'processing'].includes(order.status);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div className="flex items-center gap-3">
          <Link to="/orders" className="p-2 rounded-full hover:bg-stone-100 transition">
            <ChevronLeft className="w-5 h-5 text-stone-600" />
          </Link>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-stone-400">Order Information</span>
            <h1 className="font-['Syne'] text-2xl sm:text-3xl font-black text-neutral-950 font-mono mt-0.5">
              {order.order_number}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {order.status !== 'pending' && (
            <button
              onClick={handleDownloadInvoice}
              disabled={downloading}
              className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-neutral-950 rounded-xl text-xs font-bold flex items-center gap-2 border border-stone-300 transition"
            >
              <Download className="w-4 h-4" />
              <span>{downloading ? 'Downloading...' : 'Tax Invoice (PDF)'}</span>
            </button>
          )}

          {canCancel && (
            <button
              onClick={handleCancelOrder}
              disabled={cancelling}
              className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold border border-rose-200 transition"
            >
              {cancelling ? 'Cancelling...' : 'Cancel Order'}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left: Snapshotted Items */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-stone-200/80 shadow-sm space-y-4">
            <h3 className="font-['Syne'] text-base font-bold text-neutral-950">
              Purchased Items ({order.items?.length || 0})
            </h3>

            <div className="divide-y divide-stone-100">
              {order.items?.map((item) => (
                <div key={item.id} className="py-4 flex gap-4 items-center">
                  <div className="w-16 h-20 rounded-xl overflow-hidden bg-stone-100 shrink-0 border border-stone-200">
                    <img src={item.image} alt={item.product_name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-xs text-neutral-950">{item.product_name}</h4>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      Size: <strong>{item.size}</strong> • Color: <strong>{item.color}</strong> • Qty: <strong>{item.qty}</strong>
                    </p>
                    <p className="font-bold font-['Syne'] text-xs text-neutral-950 mt-1">
                      ₹{Number(item.unit_price).toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery & Payment Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-3xl p-6 border border-stone-200/80 shadow-sm space-y-2">
              <h4 className="font-bold text-xs uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-stone-900" />
                Shipping Destination
              </h4>
              <p className="font-bold text-xs text-neutral-950 pt-1">{addr.name}</p>
              <p className="text-xs text-stone-600">{addr.line1}, {addr.line2}</p>
              <p className="text-xs text-stone-600">{addr.city}, {addr.state} - {addr.pincode}</p>
              <p className="text-[11px] text-stone-500">Phone: {addr.phone}</p>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-stone-200/80 shadow-sm space-y-2">
              <h4 className="font-bold text-xs uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-stone-900" />
                Payment Summary
              </h4>
              <p className="text-xs text-stone-600 pt-1">Method: Razorpay Test Mode</p>
              <p className="text-xs text-stone-600 font-mono">Payment ID: {order.razorpay_payment_id || 'N/A'}</p>
              <p className="text-xs text-stone-600">Status: <strong className="uppercase">{order.payment_status}</strong></p>
            </div>
          </div>
        </div>

        {/* Right: Price Breakdown */}
        <div className="bg-white rounded-3xl p-6 border border-stone-200/80 shadow-sm space-y-4">
          <h3 className="font-['Syne'] text-base font-bold text-neutral-950">
            Total Breakdown
          </h3>

          <div className="space-y-2 text-xs text-stone-600">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-bold text-neutral-950">₹{Number(order.subtotal).toLocaleString('en-IN')}</span>
            </div>

            {Number(order.discount) > 0 && (
              <div className="flex justify-between text-emerald-600 font-semibold">
                <span>Discount ({order.coupon_code || 'Promo'})</span>
                <span>-₹{Number(order.discount).toLocaleString('en-IN')}</span>
              </div>
            )}

            <div className="flex justify-between">
              <span>Shipping</span>
              <span className="font-bold text-neutral-950">
                {Number(order.shipping_fee) === 0 ? 'FREE' : `₹${order.shipping_fee}`}
              </span>
            </div>

            <div className="flex justify-between text-stone-400 text-[11px]">
              <span>Estimated GST (Included)</span>
              <span>₹{Number(order.tax).toLocaleString('en-IN')}</span>
            </div>

            <div className="border-t border-stone-200 pt-3 flex justify-between text-sm font-bold text-neutral-950 font-['Syne']">
              <span>Total Paid</span>
              <span className="text-lg">₹{Number(order.total).toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
