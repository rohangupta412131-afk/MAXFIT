import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  Upload, 
  Camera, 
  Check, 
  Trash2, 
  ShoppingBag, 
  Download, 
  RefreshCw, 
  ArrowRight, 
  Info,
  Clock,
  Layers
} from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../config/supabase';
import { api } from '../config/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { compressImage } from '../utils/imageCompressor';
import { BeforeAfterSlider } from '../components/tryon/BeforeAfterSlider';

export const TryonStudio = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();

  const preselectedProductId = searchParams.get('product');

  // State
  const [activeTab, setActiveTab] = useState('studio'); // 'studio' | 'history'
  const [tryonProducts, setTryonProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Upload & job state
  const [personFile, setPersonFile] = useState(null);
  const [personPreview, setPersonPreview] = useState(null);
  const [personUploadPath, setPersonUploadPath] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Generation state
  const [currentJob, setCurrentJob] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState('');
  const [resultData, setResultData] = useState(null);

  // History state
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Size selection on result
  const [selectedSize, setSelectedSize] = useState('');

  const pollingRef = useRef(null);

  // 1. Fetch available tryon-enabled products
  useEffect(() => {
    api.get('/products?limit=50').then(res => {
      const items = (res.data?.products || []).filter(p => p.tryon_enabled);
      setTryonProducts(items);

      if (preselectedProductId) {
        const found = items.find(p => p.id === preselectedProductId);
        if (found) {
          setSelectedProduct(found);
          if (found.variants?.[0]) setSelectedSize(found.variants[0].size);
        }
      } else if (items.length > 0 && !selectedProduct) {
        setSelectedProduct(items[0]);
        if (items[0].variants?.[0]) setSelectedSize(items[0].variants[0].size);
      }
    }).catch(err => console.warn('Tryon products fetch error:', err));
  }, [preselectedProductId]);

  // 2. Fetch history when user clicks History tab
  const fetchHistory = async () => {
    if (!user) return;
    try {
      setLoadingHistory(true);
      const res = await api.get('/tryon');
      if (res.success) setHistory(res.data || []);
    } catch (err) {
      console.warn('Tryon history fetch note:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab]);

  // Handle user photo selection & client compression
  const handlePhotoSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (JPEG, PNG, WEBP)');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      toast.error('Image size must be under 8 MB');
      return;
    }

    try {
      toast.loading('Optimizing photo for AI model...');
      const compressed = await compressImage(file, 768, 1024, 0.88);
      toast.dismiss();

      setPersonFile(compressed);
      setPersonPreview(URL.createObjectURL(compressed));
      setResultData(null); // Reset previous result
    } catch (err) {
      toast.dismiss();
      toast.error('Image processing failed');
    }
  };

  // Upload to Supabase private storage and submit tryon job
  const handleStartGeneration = async () => {
    if (!user) {
      toast.error('Please sign in to run Virtual Try-On');
      navigate('/login');
      return;
    }

    if (!selectedProduct) {
      toast.error('Please choose a garment to try on');
      return;
    }

    if (!personFile && !personUploadPath) {
      toast.error('Please upload your photo');
      return;
    }

    try {
      setGenerating(true);
      setGenerationStep('Uploading photo securely to private storage...');

      let uploadPath = personUploadPath;

      if (personFile && !personUploadPath) {
        // Upload to private tryon-uploads bucket under {user_id}/{filename}
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
        const path = `${user.id}/${fileName}`;

        const { error: uploadErr } = await supabase.storage
          .from('tryon-uploads')
          .upload(path, personFile, {
            contentType: 'image/jpeg',
            upsert: true
          });

        if (uploadErr) {
          throw new Error(`Upload failed: ${uploadErr.message}`);
        }

        uploadPath = path;
        setPersonUploadPath(path);
      }

      setGenerationStep('Initializing IDM-VTON neural diffusion pipeline...');

      // Call POST /tryon
      const res = await api.post('/tryon', {
        productId: selectedProduct.id,
        personPath: uploadPath
      });

      if (!res.success || !res.data) {
        throw new Error(res.error || 'Failed to submit try-on job');
      }

      const jobId = res.data.jobId;
      setCurrentJob(jobId);
      setGenerationStep('Fitting garment geometry and synthesizing drape (~25s)...');

      // Setup Polling / Realtime listener
      startJobPolling(jobId);

    } catch (err) {
      toast.error(err.message || 'Generation error');
      setGenerating(false);
      setGenerationStep('');
    }
  };

  const startJobPolling = (jobId) => {
    if (pollingRef.current) clearInterval(pollingRef.current);

    let attempts = 0;
    const maxAttempts = 60; // 3 minutes max

    pollingRef.current = setInterval(async () => {
      attempts++;
      try {
        const res = await api.get(`/tryon/${jobId}`);
        if (res.success && res.data) {
          const job = res.data;

          if (job.status === 'done') {
            clearInterval(pollingRef.current);
            setGenerating(false);
            setResultData(job);
            toast.success('Your virtual try-on is ready!');
          } else if (job.status === 'failed') {
            clearInterval(pollingRef.current);
            setGenerating(false);
            toast.error(job.error || 'AI generation failed. Please try with another clear photo.');
          }
        }
      } catch (e) {
        console.warn('Poll error:', e);
      }

      if (attempts >= maxAttempts) {
        clearInterval(pollingRef.current);
        setGenerating(false);
        toast.error('Try-on processing timed out. Please retry.');
      }
    }, 3000);
  };

  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const handleDeleteHistoryJob = async (jobId) => {
    try {
      await api.delete(`/tryon/${jobId}`);
      setHistory(history.filter(h => h.id !== jobId));
      toast.success('Try-on photo deleted');
    } catch (err) {
      toast.error('Failed to delete try-on record');
    }
  };

  const handleAddFittedToBag = async () => {
    const variant = selectedProduct.variants?.find(v => v.size === selectedSize) || selectedProduct.variants?.[0];
    if (!variant) {
      toast.error('Please select an available size');
      return;
    }
    await addToCart(variant.id, 1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header and Mode Switcher */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-stone-200 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-spin-slow" />
            <span>IDM-VTON Diffusion Engine</span>
          </div>
          <h1 className="font-['Syne'] text-3xl sm:text-4xl font-black text-neutral-950">
            Virtual Try-On Studio
          </h1>
          <p className="text-xs text-stone-500 mt-1 max-w-xl">
            See actual silhouette drape and garment fit rendered onto your photo before placing your order.
          </p>
        </div>

        {/* Studio / History Tabs */}
        <div className="flex gap-2 bg-stone-100 p-1.5 rounded-2xl border border-stone-200 text-xs font-bold">
          <button
            onClick={() => setActiveTab('studio')}
            className={`px-5 py-2 rounded-xl transition ${
              activeTab === 'studio' ? 'bg-white text-neutral-950 shadow-sm' : 'text-stone-600 hover:text-neutral-950'
            }`}
          >
            Studio Fitting
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-5 py-2 rounded-xl transition ${
              activeTab === 'history' ? 'bg-white text-neutral-950 shadow-sm' : 'text-stone-600 hover:text-neutral-950'
            }`}
          >
            My Saved Fits {history.length > 0 && `(${history.length})`}
          </button>
        </div>
      </div>

      {activeTab === 'studio' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Step 1: Pick Garment Column (4 cols) */}
          <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-stone-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-['Syne'] text-sm font-bold text-neutral-950 uppercase tracking-wider">
                1. Select Garment
              </h3>
              <span className="text-[11px] text-stone-400">{tryonProducts.length} Try-On Compatible</span>
            </div>

            {selectedProduct && (
              <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 flex gap-3 items-center">
                <img
                  src={selectedProduct.garment_image || selectedProduct.images?.[0]}
                  alt={selectedProduct.name}
                  className="w-16 h-20 object-cover rounded-xl bg-white border border-stone-200"
                />
                <div className="flex-1">
                  <h4 className="font-bold text-xs text-neutral-950 line-clamp-1">{selectedProduct.name}</h4>
                  <p className="font-black font-['Syne'] text-xs text-neutral-950 mt-1">
                    ₹{Number(selectedProduct.price).toLocaleString('en-IN')}
                  </p>
                  <p className="text-[10px] text-stone-500 line-clamp-1 mt-0.5">{selectedProduct.fabric}</p>
                </div>
              </div>
            )}

            {/* Garment Selector Carousel Grid */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-stone-600 block">Or pick another style:</span>
              <div className="grid grid-cols-3 gap-2 max-h-72 overflow-y-auto p-1">
                {tryonProducts.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setSelectedProduct(p);
                      if (p.variants?.[0]) setSelectedSize(p.variants[0].size);
                      setResultData(null);
                    }}
                    className={`aspect-[3/4] rounded-xl overflow-hidden border-2 transition relative ${
                      selectedProduct?.id === p.id
                        ? 'border-neutral-950 shadow-md ring-2 ring-neutral-950/20'
                        : 'border-stone-200 opacity-80 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={p.garment_image || p.images?.[0]}
                      alt={p.name}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Step 2 & 3: Upload Photo & Generation (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {!resultData ? (
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200/80 shadow-sm space-y-6">
                <div>
                  <h3 className="font-['Syne'] text-base font-bold text-neutral-950 uppercase tracking-wider">
                    2. Upload Your Photo
                  </h3>
                  <p className="text-xs text-stone-500 mt-1">
                    For the cleanest fit: stand facing the camera with arms slightly away from the torso, in good lighting with a plain background.
                  </p>
                </div>

                {/* Upload Drag & Drop Area */}
                <div className="relative border-2 border-dashed border-stone-300 hover:border-neutral-950 rounded-3xl p-8 text-center transition bg-stone-50/50 flex flex-col items-center justify-center min-h-[300px]">
                  {personPreview ? (
                    <div className="relative max-w-xs mx-auto rounded-2xl overflow-hidden shadow-lg border border-stone-200">
                      <img src={personPreview} alt="User Preview" className="w-full h-80 object-cover" />
                      <button
                        onClick={() => {
                          setPersonFile(null);
                          setPersonPreview(null);
                          setPersonUploadPath(null);
                        }}
                        className="absolute top-3 right-3 p-2 bg-neutral-950/80 hover:bg-neutral-950 text-white rounded-full transition shadow-md"
                        title="Remove photo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="w-16 h-16 rounded-full bg-white shadow-md border border-stone-200 mx-auto flex items-center justify-center text-stone-700">
                        <Camera className="w-8 h-8" />
                      </div>
                      <div>
                        <label className="cursor-pointer">
                          <span className="px-5 py-2.5 bg-neutral-950 text-white rounded-full text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 transition shadow-md inline-block">
                            Select Photo from Device
                          </span>
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={handlePhotoSelect}
                            className="hidden"
                          />
                        </label>
                        <p className="text-[11px] text-stone-400 mt-3">
                          Supports JPEG, PNG, WEBP (Max 8 MB)
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Photography Guidance Tips */}
                <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-stone-600">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Front-facing standing pose</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Clear daylight or good lighting</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Plain, uncluttered background</span>
                  </div>
                </div>

                {/* Consent & Privacy Notice */}
                <div className="flex items-center gap-2 text-[11px] text-stone-500">
                  <Info className="w-4 h-4 text-stone-400 shrink-0" />
                  <span>
                    Privacy Protected: Your photos are stored in an encrypted enclave and used solely to synthesize your virtual fitting. You can permanently delete them anytime.
                  </span>
                </div>

                {/* Action Button */}
                <button
                  onClick={handleStartGeneration}
                  disabled={generating || !selectedProduct || (!personFile && !personUploadPath)}
                  className="w-full py-4 bg-neutral-950 text-white rounded-full text-xs font-black uppercase tracking-wider hover:bg-neutral-800 transition shadow-xl flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {generating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>{generationStep || 'Processing Neural Diffusion...'}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>Synthesize Virtual Try-On</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              /* Step 4: Try-On Result Presentation */
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200/80 shadow-sm space-y-6 animate-in fade-in duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      Fitting Completed
                    </span>
                    <h3 className="font-['Syne'] text-2xl font-black text-neutral-950 mt-1">
                      Your AI Virtual Fitting
                    </h3>
                  </div>

                  <button
                    onClick={() => {
                      setResultData(null);
                      setGenerating(false);
                    }}
                    className="text-xs font-bold text-stone-500 hover:text-neutral-950 flex items-center gap-1"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Try Another Outfit</span>
                  </button>
                </div>

                {/* Interactive Split Comparison Slider */}
                <div className="py-2">
                  <BeforeAfterSlider
                    beforeImage={resultData.personUrl || personPreview}
                    afterImage={resultData.resultUrl}
                    beforeLabel="Original Photo"
                    afterLabel="AI Virtual Fit"
                  />
                </div>

                {/* Size Selector for Cart & Buy Now */}
                <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-stone-700">Select Size to Order</span>
                    <span className="text-xs font-black text-neutral-950 font-['Syne']">
                      ₹{Number(selectedProduct.price).toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map((sz) => {
                      const v = selectedProduct.variants?.find(variant => variant.size === sz);
                      const hasStock = v && v.stock > 0;
                      return (
                        <button
                          key={sz}
                          disabled={!hasStock}
                          onClick={() => setSelectedSize(sz)}
                          className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                            selectedSize === sz
                              ? 'bg-neutral-950 text-white border-neutral-950'
                              : hasStock
                              ? 'bg-white text-stone-800 border-stone-300 hover:border-neutral-950'
                              : 'bg-stone-100 text-stone-400 line-through cursor-not-allowed'
                          }`}
                        >
                          {sz}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleAddFittedToBag}
                    className="flex-1 py-3.5 px-6 rounded-full bg-neutral-950 text-white text-xs font-extrabold uppercase tracking-wider hover:bg-neutral-800 transition shadow-lg flex items-center justify-center gap-2"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Add this fit to Bag</span>
                  </button>

                  <a
                    href={resultData.resultUrl}
                    download={`maxfit-tryon-${Date.now()}.png`}
                    target="_blank"
                    rel="noreferrer"
                    className="py-3.5 px-6 rounded-full border border-stone-300 text-neutral-950 text-xs font-extrabold uppercase tracking-wider hover:bg-stone-50 transition flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download High-Res</span>
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* History Gallery Tab */
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-['Syne'] text-xl font-bold text-neutral-950">
              Saved Try-On Outfits ({history.length})
            </h2>
            <button
              onClick={fetchHistory}
              className="text-xs font-semibold text-stone-500 hover:text-neutral-950 flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
          </div>

          {loadingHistory ? (
            <div className="py-12 flex justify-center">
              <div className="w-8 h-8 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : history.length === 0 ? (
            <div className="py-20 text-center bg-white rounded-3xl border border-stone-200 p-8 space-y-4">
              <div className="w-12 h-12 rounded-full bg-stone-100 mx-auto flex items-center justify-center text-stone-400">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="font-['Syne'] text-lg font-bold text-neutral-900">No try-on history found</h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                Generate your first AI virtual try-on in the studio tab and your outfits will automatically be preserved here.
              </p>
              <button
                onClick={() => setActiveTab('studio')}
                className="px-6 py-2.5 rounded-full bg-neutral-950 text-white text-xs font-bold uppercase tracking-wider"
              >
                Launch Studio
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {history.map((job) => (
                <div
                  key={job.id}
                  className="bg-white rounded-3xl overflow-hidden border border-stone-200/80 shadow-sm p-4 space-y-4"
                >
                  <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-stone-100 border border-stone-200">
                    <img
                      src={job.resultUrl || job.personUrl}
                      alt="Try-on result"
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => handleDeleteHistoryJob(job.id)}
                      className="absolute top-3 right-3 p-2 bg-neutral-950/80 hover:bg-rose-600 text-white rounded-full transition shadow-md"
                      title="Delete try-on"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-xs text-neutral-950 line-clamp-1">
                        {job.product?.name || 'Garment Fit'}
                      </h4>
                      <p className="text-[11px] text-stone-500 mt-0.5">
                        {new Date(job.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>

                    {job.product && (
                      <Link
                        to={`/product/${job.product.slug}`}
                        className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-neutral-950 rounded-xl text-xs font-bold transition"
                      >
                        View Item
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
