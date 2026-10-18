import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  MapPin, 
  Plus, 
  CreditCard, 
  Check, 
  AlertCircle,
  ArrowRight,
  ChevronLeft
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../config/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { loadRazorpayScript } from '../utils/razorpay';

export const Checkout = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { cartItems, cartSummary, refreshCart } = useCart();

  const buyNowVariantId = searchParams.get('buyNowVariantId');
  const buyNowQty = parseInt(searchParams.get('buyNowQty') || '1', 10);

  const [buyNowItem, setBuyNowItem] = useState(null);
  const [buyNowSummary, setBuyNowSummary] = useState(null);
  const [loadingBuyNow, setLoadingBuyNow] = useState(!!buyNowVariantId);

  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [showNewAddressModal, setShowNewAddressModal] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);

  const isBuyNow = !!buyNowVariantId;

  // New address form state
  const [newAddr, setNewAddr] = useState({
    name: profile?.full_name || '',
    phone: profile?.phone || '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    pincode: '',
    is_default: true
  });

  const fetchAddresses = async () => {
    try {
      const res = await api.get('/auth/addresses');
      if (res.success && res.data) {
        setAddresses(res.data);
        const def = res.data.find(a => a.is_default) || res.data[0];
        if (def) setSelectedAddressId(def.id);
      }
    } catch (err) {
      console.warn('Address load warning:', err);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  // Fetch Buy Now preview when buyNowVariantId is present
  useEffect(() => {
    if (!buyNowVariantId) return;

    const fetchBuyNowData = async () => {
      try {
        setLoadingBuyNow(true);
        const res = await api.get(`/cart/buy-now-preview?variantId=${buyNowVariantId}&qty=${buyNowQty}`);
        if (res.success && res.data) {
          setBuyNowItem(res.data.item);
          setBuyNowSummary(res.data.summary);
        } else {
          toast.error(res.error || 'Failed to retrieve product details for Buy Now');
        }
      } catch (err) {
        toast.error(err.message || 'Error loading product details');
      } finally {
        setLoadingBuyNow(false);
      }
    };

    fetchBuyNowData();
  }, [buyNowVariantId, buyNowQty]);

  const activeSummary = isBuyNow 
    ? (buyNowSummary || { subtotal: 0, discount: 0, shippingFee: 0, gstBreakdown: { totalTax: 0 }, total: 0 })
    : cartSummary;

  const handleCreateAddress = async (e) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(newAddr.pincode)) {
      toast.error('Pincode must be exactly 6 digits');
      return;
    }

    try {
      const res = await api.post('/auth/addresses', newAddr);
      toast.success('Address saved');
      setShowNewAddressModal(false);
      await fetchAddresses();
      if (res.data?.id) setSelectedAddressId(res.data.id);
    } catch (err) {
      toast.error(err.message || 'Failed to save address');
    }
  };

  const handleProceedToPayment = async () => {
    if (!selectedAddressId) {
      toast.error('Please select or add a shipping address');
      return;
    }

    try {
      setProcessingPayment(true);

      // 1. Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error('Razorpay SDK failed to load. Are you connected to the internet?');
        return;
      }

      // 2. Call backend to create Razorpay Order & DB pending order
      const res = await api.post('/payments/create-order', {
        addressId: selectedAddressId,
        buyNowVariantId: buyNowVariantId || null,
        buyNowQty: buyNowVariantId ? buyNowQty : 1
      });

      if (!res.success || !res.data) {
        throw new Error(res.error || 'Failed to initialize payment');
      }

      const { orderId, orderNumber, razorpayOrderId, amount, keyId } = res.data;
      const addr = addresses.find(a => a.id === selectedAddressId);

      // 3. Open Razorpay Checkout modal
      const options = {
        key: keyId,
        amount,
        currency: 'INR',
        name: 'MAXFIT Studio',
        description: `Order ${orderNumber}`,
        order_id: razorpayOrderId,
        prefill: {
          name: addr?.name || profile?.full_name || 'Customer',
          email: user?.email || '',
          contact: addr?.phone || profile?.phone || ''
        },
        theme: {
          color: '#0f172a'
        },
        handler: async function (response) {
          try {
            toast.loading('Verifying payment securely...');
            // 4. Verify HMAC SHA256 on backend
            const verifyRes = await api.post('/payments/verify', {
              orderId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });

            if (verifyRes.success) {
              toast.dismiss();
              toast.success('Payment verified successfully!');
              await refreshCart();
              navigate(`/order-success/${verifyRes.data.orderNumber}`);
            } else {
              toast.dismiss();
              toast.error(verifyRes.error || 'Payment verification failed');
            }
          } catch (err) {
            toast.dismiss();
            toast.error(err.message || 'Payment verification error');
          }
        },
        modal: {
          ondismiss: function () {
            toast('Payment modal closed. You can retry checkout anytime.', { icon: 'ℹ️' });
            setProcessingPayment(false);
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', function (resp) {
        toast.error(`Payment failed: ${resp.error.description || 'Transaction declined'}`);
        setProcessingPayment(false);
      });
      razorpay.open();

    } catch (err) {
      toast.error(err.message || 'Payment initiation error');
      setProcessingPayment(false);
    }
  };

  if (!isBuyNow && cartItems.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center space-y-4">
        <h2 className="font-['Syne'] text-2xl font-bold text-neutral-950">Your Bag is Empty</h2>
        <p className="text-xs text-stone-500">There are no items currently in your shopping bag to checkout.</p>
        <Link
          to="/shop"
          className="inline-block px-6 py-3 bg-neutral-950 text-white rounded-full text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 transition"
        >
          Explore Men's Collection
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex items-center gap-2">
        <Link to="/cart" className="p-2 rounded-full hover:bg-stone-100 transition">
          <ChevronLeft className="w-5 h-5 text-stone-600" />
        </Link>
        <h1 className="font-['Syne'] text-3xl font-black text-neutral-950">
          Secure Checkout
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
        {/* Left: Address & Payment Selection */}
        <div className="lg:col-span-2 space-y-8">
          {/* Step 1: Delivery Address */}
          <div className="bg-white rounded-3xl p-6 border border-stone-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-['Syne'] text-base font-bold text-neutral-950 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-stone-900" />
                <span>1. Select Delivery Address</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowNewAddressModal(true)}
                className="text-xs font-bold text-neutral-950 hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add New</span>
              </button>
            </div>

            {addresses.length === 0 ? (
              <div className="py-8 text-center space-y-3 bg-stone-50 rounded-2xl border border-dashed border-stone-300">
                <p className="text-xs text-stone-500">No saved address found.</p>
                <button
                  onClick={() => setShowNewAddressModal(true)}
                  className="px-4 py-2 bg-neutral-950 text-white rounded-xl text-xs font-bold shadow-sm"
                >
                  Add Shipping Address
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {addresses.map((addr) => (
                  <div
                    key={addr.id}
                    onClick={() => setSelectedAddressId(addr.id)}
                    className={`p-4 rounded-2xl border cursor-pointer transition ${
                      selectedAddressId === addr.id
                        ? 'border-neutral-950 bg-stone-50/80 ring-2 ring-neutral-950/10'
                        : 'border-stone-200 bg-white hover:border-stone-400'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-neutral-950">{addr.name}</span>
                      {selectedAddressId === addr.id && (
                        <div className="w-4 h-4 rounded-full bg-neutral-950 text-white flex items-center justify-center">
                          <Check className="w-2.5 h-2.5" />
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-stone-600 line-clamp-2">{addr.line1}, {addr.line2}</p>
                    <p className="text-xs text-stone-600 mt-0.5">{addr.city}, {addr.state} - <strong>{addr.pincode}</strong></p>
                    <p className="text-[11px] text-stone-500 mt-1">Phone: {addr.phone}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Step 2: Payment Method */}
          <div className="bg-white rounded-3xl p-6 border border-stone-200/80 shadow-sm space-y-4">
            <h3 className="font-['Syne'] text-base font-bold text-neutral-950 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-stone-900" />
              <span>2. Payment Method</span>
            </h3>

            <div className="p-4 rounded-2xl border border-neutral-950 bg-stone-50/80 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-bold text-neutral-950 flex items-center gap-2">
                  <span>Razorpay Secure (UPI, Cards, NetBanking, Wallets)</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold uppercase">
                    Test Mode Active
                  </span>
                </span>
                <p className="text-[11px] text-stone-500">
                  Instant mock checkout supported with test UPI, NetBanking, and credit/debit cards.
                </p>
              </div>
              <div className="w-5 h-5 rounded-full bg-neutral-950 text-white flex items-center justify-center">
                <Check className="w-3 h-3" />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Order Summary Sidebar */}
        <div className="bg-white rounded-3xl p-6 border border-stone-200/80 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-['Syne'] text-base font-bold text-neutral-950">
              {isBuyNow ? 'Buy Now Summary' : 'Payment Summary'}
            </h3>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-stone-100 text-stone-700 px-2.5 py-1 rounded-lg">
              {isBuyNow ? 'Single Item Direct' : `${cartItems.length} Item(s)`}
            </span>
          </div>

          {/* Item Preview */}
          {loadingBuyNow ? (
            <div className="p-4 bg-stone-50 rounded-2xl flex items-center justify-center gap-2 text-xs text-stone-500">
              <div className="w-4 h-4 border-2 border-stone-400 border-t-transparent rounded-full animate-spin"></div>
              <span>Loading garment details...</span>
            </div>
          ) : isBuyNow && buyNowItem ? (
            <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200/80 flex items-center gap-3">
              <img
                src={buyNowItem.variant?.product?.images?.[0] || buyNowItem.variant?.product?.garment_image}
                alt={buyNowItem.variant?.product?.name}
                className="w-14 h-16 object-cover rounded-xl bg-white border border-stone-200 shrink-0"
              />
              <div className="overflow-hidden flex-1">
                <p className="font-bold text-xs text-neutral-950 truncate">
                  {buyNowItem.variant?.product?.name}
                </p>
                <div className="flex items-center gap-2 mt-1 text-[11px] text-stone-500">
                  <span className="font-bold text-neutral-900 bg-white border border-stone-200 px-1.5 py-0.5 rounded">
                    Size: {buyNowItem.variant?.size}
                  </span>
                  <span>Qty: {buyNowItem.qty}</span>
                </div>
                <p className="font-black font-['Syne'] text-xs text-neutral-950 mt-1">
                  ₹{Number(buyNowItem.variant?.product?.price).toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          ) : !isBuyNow && cartItems.length > 0 ? (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {cartItems.map((item) => (
                <div key={item.id} className="p-2.5 bg-stone-50 rounded-xl border border-stone-100 flex items-center gap-2.5">
                  <img
                    src={item.variant?.product?.images?.[0] || item.variant?.product?.garment_image}
                    alt=""
                    className="w-10 h-12 object-cover rounded-lg bg-white border border-stone-200 shrink-0"
                  />
                  <div className="overflow-hidden flex-1">
                    <p className="font-bold text-xs text-neutral-950 truncate">{item.variant?.product?.name}</p>
                    <span className="text-[10px] text-stone-500">Size: {item.variant?.size} • Qty: {item.qty}</span>
                  </div>
                  <span className="text-xs font-bold text-neutral-950">
                    ₹{(Number(item.variant?.product?.price) * item.qty).toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>
          ) : null}

          <div className="space-y-2.5 text-xs text-stone-600">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-bold text-neutral-950">₹{activeSummary.subtotal.toLocaleString('en-IN')}</span>
            </div>

            {activeSummary.discount > 0 && (
              <div className="flex justify-between text-emerald-600 font-semibold">
                <span>Promotional Discount</span>
                <span>-₹{activeSummary.discount.toLocaleString('en-IN')}</span>
              </div>
            )}

            <div className="flex justify-between">
              <span>Shipping Fee</span>
              <span className="font-bold text-neutral-950">
                {activeSummary.shippingFee === 0 ? 'FREE' : `₹${activeSummary.shippingFee}`}
              </span>
            </div>

            <div className="flex justify-between text-stone-400 text-[11px]">
              <span>Estimated GST (Included)</span>
              <span>₹{activeSummary.gstBreakdown?.totalTax || 0}</span>
            </div>

            <div className="border-t border-stone-200 pt-3 flex justify-between text-sm font-bold text-neutral-950 font-['Syne']">
              <span>Total Payable</span>
              <span className="text-lg">₹{activeSummary.total.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <button
            onClick={handleProceedToPayment}
            disabled={processingPayment || !selectedAddressId || activeSummary.total <= 0 || loadingBuyNow}
            className="w-full py-4 bg-neutral-950 text-white rounded-full text-xs font-extrabold uppercase tracking-wider hover:bg-neutral-800 transition shadow-xl flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {processingPayment ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Connecting to Gateway...</span>
              </>
            ) : (
              <>
                <span>Pay ₹{activeSummary.total.toLocaleString('en-IN')} Now</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <div className="pt-1 flex items-center justify-center gap-1.5 text-[11px] text-stone-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Encrypted with Razorpay Test Mode</span>
          </div>
        </div>
      </div>

      {/* New Address Modal */}
      {showNewAddressModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-stone-200">
            <h3 className="font-['Syne'] text-lg font-bold text-neutral-950 mb-4">
              Add Delivery Address
            </h3>

            <form onSubmit={handleCreateAddress} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Full Name *"
                  value={newAddr.name}
                  onChange={(e) => setNewAddr({ ...newAddr, name: e.target.value })}
                  className="text-xs bg-stone-50 border border-stone-300 rounded-xl p-3 focus:outline-none focus:border-neutral-900"
                  required
                />
                <input
                  type="tel"
                  placeholder="10-digit Phone Number *"
                  value={newAddr.phone}
                  onChange={(e) => setNewAddr({ ...newAddr, phone: e.target.value })}
                  className="text-xs bg-stone-50 border border-stone-300 rounded-xl p-3 focus:outline-none focus:border-neutral-900"
                  required
                />
              </div>

              <input
                type="text"
                placeholder="Flat, House no., Building, Apartment *"
                value={newAddr.line1}
                onChange={(e) => setNewAddr({ ...newAddr, line1: e.target.value })}
                className="w-full text-xs bg-stone-50 border border-stone-300 rounded-xl p-3 focus:outline-none focus:border-neutral-900"
                required
              />

              <input
                type="text"
                placeholder="Area, Street, Sector, Village (optional)"
                value={newAddr.line2}
                onChange={(e) => setNewAddr({ ...newAddr, line2: e.target.value })}
                className="w-full text-xs bg-stone-50 border border-stone-300 rounded-xl p-3 focus:outline-none focus:border-neutral-900"
              />

              <div className="grid grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="City *"
                  value={newAddr.city}
                  onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })}
                  className="text-xs bg-stone-50 border border-stone-300 rounded-xl p-3 focus:outline-none focus:border-neutral-900"
                  required
                />
                <input
                  type="text"
                  placeholder="State *"
                  value={newAddr.state}
                  onChange={(e) => setNewAddr({ ...newAddr, state: e.target.value })}
                  className="text-xs bg-stone-50 border border-stone-300 rounded-xl p-3 focus:outline-none focus:border-neutral-900"
                  required
                />
                <input
                  type="text"
                  placeholder="6-Digit PIN *"
                  maxLength={6}
                  value={newAddr.pincode}
                  onChange={(e) => setNewAddr({ ...newAddr, pincode: e.target.value })}
                  className="text-xs bg-stone-50 border border-stone-300 rounded-xl p-3 focus:outline-none focus:border-neutral-900 font-mono"
                  required
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowNewAddressModal(false)}
                  className="flex-1 py-3 border border-stone-300 text-stone-700 rounded-xl text-xs font-bold hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-neutral-950 text-white rounded-xl text-xs font-bold hover:bg-neutral-800"
                >
                  Save Address
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
