import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Download, 
  ChevronLeft, 
  MapPin, 
  CreditCard, 
  ShieldCheck, 
  AlertTriangle,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  CheckCheck,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../config/api';
import { loadRazorpayScript } from '../utils/razorpay';

export const OrderDetail = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [retryingPayment, setRetryingPayment] = useState(false);

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
    const isPaid = ['paid', 'processing'].includes(order.status);
    const confirmMsg = isPaid
      ? 'Are you sure you want to cancel this order? Stock will be restored and your refund will be processed.'
      : 'Are you sure you want to cancel this pending order?';

    if (!window.confirm(confirmMsg)) return;

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

  const handleRetryPayment = async () => {
    try {
      setRetryingPayment(true);
      const res = await api.post(`/payments/retry/${id}`);
      if (!res.success) throw new Error(res.error || 'Failed to initialize payment retry');

      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        toast.error('Razorpay SDK failed to load. Please check your network connection.');
        setRetryingPayment(false);
        return;
      }

      const { orderId, orderNumber, razorpayOrderId, amount, currency, keyId, user } = res.data;

      const options = {
        key: keyId,
        amount,
        currency,
        name: 'MAX-FIT Men’s Clothing',
        description: `Payment for Order #${orderNumber}`,
        order_id: razorpayOrderId,
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: user?.phone || ''
        },
        theme: {
          color: '#0a0a0a'
        },
        handler: async function (response) {
          try {
            toast.loading('Verifying payment with bank...');
            const verifyRes = await api.post('/payments/verify', {
              orderId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });

            if (verifyRes.success) {
              toast.dismiss();
              toast.success('Payment verified successfully!');
              await fetchOrder();
            } else {
              toast.dismiss();
              toast.error(verifyRes.error || 'Payment verification failed');
            }
          } catch (err) {
            toast.dismiss();
            toast.error(err.message || 'Payment verification error');
          } finally {
            setRetryingPayment(false);
          }
        },
        modal: {
          ondismiss: function () {
            toast('Payment modal closed. You can retry payment anytime.', { icon: 'ℹ️' });
            setRetryingPayment(false);
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', function (resp) {
        toast.error(`Payment failed: ${resp.error.description || 'Transaction declined'}`);
        setRetryingPayment(false);
      });
      razorpay.open();

    } catch (err) {
      toast.error(err.message || 'Payment retry error');
      setRetryingPayment(false);
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
  const canCancel = ['pending', 'paid', 'processing'].includes(order.status);

  // Delivery Stages Logic
  const deliveryStages = [
    { key: 'placed', label: 'Order Placed', desc: 'Order confirmed and verified' },
    { key: 'ready', label: 'Ready to be Shipped', desc: 'Packed and quality inspected' },
    { key: 'transit', label: 'In Transit', desc: 'Dispatched with logistics carrier' },
    { key: 'delivered', label: 'Delivered', desc: 'Handed over at shipping address' }
  ];

  const getStageIndex = (status) => {
    if (status === 'delivered') return 3;
    if (status === 'shipped') return 2;
    if (status === 'processing' || status === 'paid') return 1;
    if (status === 'pending') return 0;
    return -1;
  };

  const currentStageIndex = getStageIndex(order.status);
  const isCancelled = order.status === 'cancelled';

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
          {order.status === 'pending' && (
            <button
              onClick={handleRetryPayment}
              disabled={retryingPayment}
              className="px-5 py-2.5 bg-neutral-950 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md hover:scale-[1.02] active:scale-[0.98] transition"
            >
              <CreditCard className="w-4 h-4 text-amber-400" />
              <span>{retryingPayment ? 'Connecting Gateway...' : `Complete Payment (₹${order.total})`}</span>
            </button>
          )}

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

      {/* Delivery Tracking & Status Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/80 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-stone-400">Fulfillment Pipeline</span>
            <h3 className="font-['Syne'] text-lg font-bold text-neutral-950 mt-0.5">
              Delivery Tracking & Status
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-500 font-medium">Current Status:</span>
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
              order.status === 'delivered' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
              order.status === 'shipped' ? 'bg-purple-100 text-purple-800 border border-purple-200' :
              order.status === 'processing' || order.status === 'paid' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
              order.status === 'pending' ? 'bg-amber-100 text-amber-800 border border-amber-200 animate-pulse' :
              'bg-rose-100 text-rose-800 border border-rose-200'
            }`}>
              {order.status === 'processing' ? 'Ready to be Shipped' : order.status}
            </span>
          </div>
        </div>

        {/* Pending Payment Alert Banner */}
        {order.status === 'pending' && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-amber-900">Payment Pending</h4>
                <p className="text-xs text-amber-700 mt-0.5">
                  This order has not been completed. Click Complete Payment to open Razorpay and secure your order.
                </p>
              </div>
            </div>
            <button
              onClick={handleRetryPayment}
              disabled={retryingPayment}
              className="px-5 py-2.5 bg-neutral-950 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold shrink-0 shadow-md flex items-center justify-center gap-2 transition"
            >
              <CreditCard className="w-4 h-4 text-amber-400" />
              <span>{retryingPayment ? 'Loading...' : `Pay Now ₹${order.total}`}</span>
            </button>
          </div>
        )}

        {/* Cancelled Banner */}
        {isCancelled && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3">
            <RotateCcw className="w-5 h-5 text-rose-600 shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-rose-900">Order Cancelled</h4>
              <p className="text-xs text-rose-700 mt-0.5">
                This order was cancelled. Payment status: <strong className="uppercase">{order.payment_status}</strong>.
              </p>
            </div>
          </div>
        )}

        {/* 4-Step Visual Stepper */}
        {!isCancelled && (
          <div className="pt-2">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative">
              {deliveryStages.map((stage, idx) => {
                const isDone = currentStageIndex >= idx;
                const isCurrent = currentStageIndex === idx;

                return (
                  <div key={stage.key} className={`flex flex-col items-center text-center p-4 rounded-2xl border transition ${
                    isCurrent 
                      ? 'bg-amber-50/50 border-amber-300 ring-2 ring-amber-400/20 shadow-sm'
                      : isDone
                      ? 'bg-emerald-50/40 border-emerald-200'
                      : 'bg-stone-50 border-stone-200/60 opacity-60'
                  }`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2.5 transition shadow-sm ${
                      isDone 
                        ? 'bg-neutral-950 text-white' 
                        : 'bg-white border-2 border-stone-300 text-stone-400'
                    }`}>
                      {isDone ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <span className="text-xs font-bold">{idx + 1}</span>
                      )}
                    </div>
                    <h4 className={`text-xs font-bold ${isCurrent ? 'text-neutral-950 font-black' : isDone ? 'text-stone-800' : 'text-stone-400'}`}>
                      {stage.label}
                    </h4>
                    <p className="text-[10px] text-stone-500 mt-1 max-w-[140px]">
                      {stage.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
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
