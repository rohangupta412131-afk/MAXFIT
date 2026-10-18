import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Sparkles, 
  Heart, 
  ShoppingBag, 
  Ruler, 
  ShieldCheck, 
  Truck, 
  RefreshCw, 
  Check, 
  AlertCircle,
  ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../config/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { SizeGuideModal } from '../components/product/SizeGuideModal';
import { SizeRecommenderModal } from '../components/product/SizeRecommenderModal';
import { ProductCard } from '../components/product/ProductCard';

export const ProductDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isWishlisted, setIsWishlisted] = useState(false);

  // Modals
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [sizeRecommenderOpen, setSizeRecommenderOpen] = useState(false);

  useEffect(() => {
    async function loadProduct() {
      try {
        setLoading(true);
        const res = await api.get(`/products/${slug}`);
        if (res.success && res.data) {
          setProduct(res.data);
          // Set default color & size if variants exist
          if (res.data.variants?.length > 0) {
            const firstAvailable = res.data.variants.find(v => v.stock > 0) || res.data.variants[0];
            setSelectedSize(firstAvailable.size);
            setSelectedColor(firstAvailable.color);
          }
        }
      } catch (err) {
        toast.error('Product not found');
        navigate('/shop');
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [slug, navigate]);

  if (loading || !product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 flex justify-center">
        <div className="w-10 h-10 border-4 border-neutral-900 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Find variant matching selected size & color
  const currentVariant = product.variants?.find(
    v => v.size === selectedSize && (!selectedColor || v.color === selectedColor)
  );

  const availableColors = [...new Set(product.variants?.map(v => v.color) || [])];
  const availableSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

  const discountPercent = product.mrp > product.price
    ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
    : 0;

  const handleAddToBag = async () => {
    if (!currentVariant) {
      toast.error('Please select an available size');
      return;
    }
    if (currentVariant.stock <= 0) {
      toast.error('Selected size is out of stock');
      return;
    }
    await addToCart(currentVariant.id, qty);
  };

  const handleBuyNow = () => {
    if (!currentVariant) {
      toast.error('Please select an available size');
      return;
    }
    if (currentVariant.stock <= 0) {
      toast.error('Selected size is out of stock');
      return;
    }
    if (!user) {
      toast.error('Please sign in to proceed with checkout');
      navigate('/login');
      return;
    }
    // Navigate directly to checkout with single Buy Now item params
    navigate(`/checkout?buyNowVariantId=${currentVariant.id}&buyNowQty=${qty}`);
  };

  const allImages = product.images && product.images.length > 0
    ? product.images
    : [product.garment_image];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-16">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-stone-500">
        <Link to="/" className="hover:text-neutral-950">Home</Link>
        <ChevronRight className="w-3 h-3" />
        <Link to="/shop" className="hover:text-neutral-950">Shop</Link>
        {product.category && (
          <>
            <ChevronRight className="w-3 h-3" />
            <Link to={`/shop?category=${product.category.slug}`} className="hover:text-neutral-950">
              {product.category.name}
            </Link>
          </>
        )}
        <ChevronRight className="w-3 h-3" />
        <span className="text-neutral-950 font-semibold truncate">{product.name}</span>
      </nav>

      {/* Main Product Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
        {/* Left: Image Gallery */}
        <div className="space-y-4">
          {/* Main Large Display Frame */}
          <div className="relative aspect-[3/4] rounded-3xl overflow-hidden bg-stone-100 border border-stone-200/80 shadow-md">
            <img
              src={allImages[selectedImage] || allImages[0]}
              alt={product.name}
              className="w-full h-full object-cover object-center"
            />

            {/* Quick Virtual Try-On Floating Pill */}
            {product.tryon_enabled && (
              <button
                onClick={() => navigate(`/tryon?product=${product.id}`)}
                className="absolute top-4 right-4 z-10 px-4 py-2 bg-neutral-950/90 text-white rounded-full text-xs font-bold flex items-center gap-2 shadow-xl backdrop-blur-md hover:bg-neutral-900 hover:scale-105 transition"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin-slow" />
                <span>Virtual Try-On</span>
              </button>
            )}
          </div>

          {/* Thumbnail Track */}
          {allImages.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {allImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`w-20 aspect-square rounded-2xl overflow-hidden border-2 transition ${
                    selectedImage === idx ? 'border-neutral-950 scale-105 shadow-md' : 'border-stone-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Product Details & Purchase Form */}
        <div className="space-y-6">
          <div>
            {product.category?.name && (
              <span className="text-xs uppercase font-extrabold tracking-widest text-stone-400 block mb-1">
                {product.category.name}
              </span>
            )}
            <h1 className="font-['Syne'] text-3xl sm:text-4xl font-black text-neutral-950 leading-tight">
              {product.name}
            </h1>
          </div>

          {/* Pricing Box */}
          <div className="flex items-baseline gap-4 p-4 rounded-2xl bg-stone-50 border border-stone-200/80">
            <span className="text-3xl font-black font-['Syne'] text-neutral-950">
              ₹{Number(product.price).toLocaleString('en-IN')}
            </span>
            {product.mrp > product.price && (
              <>
                <span className="text-stone-400 line-through text-base">
                  ₹{Number(product.mrp).toLocaleString('en-IN')}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-neutral-950 text-white text-xs font-extrabold uppercase">
                  Save {discountPercent}%
                </span>
              </>
            )}
            <span className="text-[11px] text-stone-500 ml-auto font-medium">Inclusive of all taxes</span>
          </div>

          {/* AI Virtual Try-On Banner on Product Page */}
          {product.tryon_enabled && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300/60 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-400 text-neutral-950 flex items-center justify-center shrink-0 shadow-sm">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-neutral-950">See it on yourself before buying</h4>
                  <p className="text-[11px] text-stone-600">AI diffusion renders this exact piece onto your uploaded photo.</p>
                </div>
              </div>
              <button
                onClick={() => navigate(`/tryon?product=${product.id}`)}
                className="px-4 py-2 bg-neutral-950 text-white rounded-xl text-xs font-bold shrink-0 hover:bg-neutral-800 transition shadow-sm"
              >
                Try On Now
              </button>
            </div>
          )}

          {/* Colour Swatches */}
          {availableColors.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-700">
                Colour: <strong className="text-neutral-950">{selectedColor}</strong>
              </span>
              <div className="flex gap-2">
                {availableColors.map((col) => (
                  <button
                    key={col}
                    onClick={() => setSelectedColor(col)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition ${
                      selectedColor === col
                        ? 'border-neutral-950 bg-neutral-950 text-white'
                        : 'border-stone-300 bg-white text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    {col}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Size Selector with Stock & Sizing Assistants */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-700">
                Select Size
              </span>
              <div className="flex items-center gap-4 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setSizeRecommenderOpen(true)}
                  className="text-amber-700 hover:text-amber-900 flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Recommend My Size</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSizeGuideOpen(true)}
                  className="text-stone-500 hover:text-neutral-950 flex items-center gap-1 underline"
                >
                  <Ruler className="w-3.5 h-3.5" />
                  <span>Size Guide</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-6 gap-2">
              {availableSizes.map((sz) => {
                const variantForSize = product.variants?.find(
                  v => v.size === sz && (!selectedColor || v.color === selectedColor)
                );
                const hasStock = variantForSize && variantForSize.stock > 0;
                const isSelected = selectedSize === sz;

                return (
                  <button
                    key={sz}
                    disabled={!hasStock}
                    onClick={() => {
                      setSelectedSize(sz);
                      setQty(1);
                    }}
                    className={`py-3 rounded-xl text-xs font-bold border transition relative ${
                      isSelected
                        ? 'border-neutral-950 bg-neutral-950 text-white shadow-md'
                        : hasStock
                        ? 'border-stone-300 bg-white text-stone-800 hover:border-neutral-950'
                        : 'border-stone-200 bg-stone-100 text-stone-400 cursor-not-allowed line-through'
                    }`}
                  >
                    {sz}
                  </button>
                );
              })}
            </div>

            {/* Stock Scarcity Alert */}
            {currentVariant && (
              <div className="text-xs pt-1">
                {currentVariant.stock <= 0 ? (
                  <span className="text-rose-600 font-semibold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> Currently out of stock in this size
                  </span>
                ) : currentVariant.stock < 5 ? (
                  <span className="text-amber-700 font-semibold flex items-center gap-1 animate-pulse">
                    <AlertCircle className="w-3.5 h-3.5" /> Only {currentVariant.stock} left in stock — order soon!
                  </span>
                ) : (
                  <span className="text-emerald-700 font-medium flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> In Stock & Ready to Ship
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Quantity Selector & Action Buttons */}
          <div className="space-y-3 pt-4 border-t border-stone-200">
            <div className="flex items-center gap-3">
              <div className="flex items-center border border-stone-300 rounded-full px-3 py-1.5 bg-stone-50">
                <button
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="w-6 h-6 text-stone-600 hover:text-neutral-950 font-bold"
                >
                  -
                </button>
                <span className="w-8 text-center text-xs font-bold text-neutral-950">{qty}</span>
                <button
                  onClick={() => setQty(Math.min(currentVariant?.stock || 10, qty + 1))}
                  className="w-6 h-6 text-stone-600 hover:text-neutral-950 font-bold"
                >
                  +
                </button>
              </div>

              <button
                onClick={handleAddToBag}
                disabled={!currentVariant || currentVariant.stock <= 0}
                className="flex-1 py-4 px-6 rounded-full bg-neutral-950 text-white font-bold text-xs uppercase tracking-wider hover:bg-neutral-800 transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Add to Bag</span>
              </button>

              <button
                onClick={handleBuyNow}
                disabled={!currentVariant || currentVariant.stock <= 0}
                className="py-4 px-6 rounded-full bg-stone-100 text-neutral-950 border border-stone-300 font-bold text-xs uppercase tracking-wider hover:bg-stone-200 transition disabled:opacity-50"
              >
                Buy Now
              </button>
            </div>
          </div>

          {/* Fabric, Care, and Specs Accordion */}
          <div className="border-t border-stone-200 pt-6 space-y-4 text-xs text-stone-600">
            <div>
              <h4 className="font-bold text-neutral-950 uppercase tracking-wider mb-1">Fabric & Texture</h4>
              <p>{product.fabric || '100% Premium Cotton'}</p>
            </div>

            <div>
              <h4 className="font-bold text-neutral-950 uppercase tracking-wider mb-1">Care Instructions</h4>
              <p>{product.care_instructions || 'Machine wash cold with like colors.'}</p>
            </div>

            <div>
              <h4 className="font-bold text-neutral-950 uppercase tracking-wider mb-1">Product Description</h4>
              <p className="leading-relaxed">{product.description}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products Section */}
      {product.related && product.related.length > 0 && (
        <div className="pt-10 border-t border-stone-200">
          <h2 className="font-['Syne'] text-2xl font-black text-neutral-950 mb-6">
            Complete the Aesthetic
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
            {product.related.map((rel) => (
              <ProductCard key={rel.id} product={rel} />
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      <SizeGuideModal
        isOpen={sizeGuideOpen}
        onClose={() => setSizeGuideOpen(false)}
        categoryId={product.category_id}
        categoryName={product.category?.name}
      />

      <SizeRecommenderModal
        isOpen={sizeRecommenderOpen}
        onClose={() => setSizeRecommenderOpen(false)}
        categoryId={product.category_id}
        productId={product.id}
        onSelectSize={(sz) => setSelectedSize(sz)}
      />
    </div>
  );
};
