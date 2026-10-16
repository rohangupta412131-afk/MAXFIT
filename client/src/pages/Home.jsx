import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, ShieldCheck, Zap, Layers, RefreshCw } from 'lucide-react';
import { api } from '../config/api';
import { ProductCard } from '../components/product/ProductCard';

export const Home = () => {
  const [categories, setCategories] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [catRes, prodRes] = await Promise.all([
          api.get('/categories'),
          api.get('/products?limit=8&sort=newest')
        ]);
        if (catRes.data) setCategories(catRes.data);
        if (prodRes.data?.products) setFeaturedProducts(prodRes.data.products);
      } catch (err) {
        console.warn('Home data fetch note:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-20 pb-20">
      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex items-center justify-center bg-stone-900 overflow-hidden text-white">
        {/* Background Image with Cinematic Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1800&auto=format&fit=crop&q=85"
            alt="MAXFIT Hero Collection"
            className="w-full h-full object-cover object-center opacity-40 scale-105 animate-pulse-slow"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/60 to-transparent"></div>
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 pt-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold uppercase tracking-widest text-amber-300 shadow-xl">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Spring / Summer 2026 Collection</span>
          </div>

          <h1 className="font-['Syne'] text-4xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[1.05] max-w-4xl mx-auto">
            PRECISION FIT. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-stone-100 via-stone-300 to-amber-200">
              AI VIRTUAL TRY-ON.
            </span>
          </h1>

          <p className="text-stone-300 text-sm sm:text-lg max-w-2xl mx-auto font-light leading-relaxed">
            Experience next-generation direct-to-consumer apparel. Upload your photo and see high-fidelity generative fitting before you order.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/shop"
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-white text-neutral-950 font-bold text-sm tracking-wide hover:bg-stone-200 hover:scale-105 transition shadow-2xl flex items-center justify-center gap-2"
            >
              <span>Explore Collection</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/tryon"
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-neutral-900/90 text-white font-bold text-sm tracking-wide border border-white/20 hover:bg-neutral-800 hover:border-amber-400 hover:scale-105 transition shadow-xl flex items-center justify-center gap-2 group backdrop-blur-md"
            >
              <Sparkles className="w-4 h-4 text-amber-400 group-hover:rotate-12 transition-transform" />
              <span>Launch Try-On Studio</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-stone-400">Curated Wardrobe</span>
            <h2 className="font-['Syne'] text-2xl sm:text-3xl font-black text-neutral-950 mt-1">
              Shop by Category
            </h2>
          </div>
          <Link to="/shop" className="text-xs font-bold text-stone-600 hover:text-neutral-950 flex items-center gap-1 transition">
            View All Categories <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/shop?category=${cat.slug}`}
              className="group relative rounded-3xl overflow-hidden aspect-[4/5] bg-stone-100 shadow-md border border-stone-200/80"
            >
              <img
                src={cat.image_url}
                alt={cat.name}
                className="w-full h-full object-cover object-center group-hover:scale-110 transition duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 via-neutral-950/20 to-transparent"></div>
              <div className="absolute bottom-5 inset-x-5 text-white">
                <h3 className="font-['Syne'] text-lg font-bold group-hover:translate-x-1 transition duration-300">
                  {cat.name}
                </h3>
                <span className="text-xs text-stone-300 font-medium flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition duration-300">
                  Shop Collection <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Virtual Try-On Promo Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl bg-neutral-950 text-white overflow-hidden p-8 sm:p-14 border border-neutral-800 shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-amber-300 text-xs font-bold tracking-widest uppercase border border-white/10">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Next-Gen Diffusion Technology</span>
              </div>

              <h2 className="font-['Syne'] text-3xl sm:text-5xl font-black tracking-tight leading-tight">
                No Guesswork. <br />
                Try Clothes On Your Photo In Seconds.
              </h2>

              <p className="text-stone-400 text-sm leading-relaxed max-w-lg">
                Powered by state-of-the-art IDM-VTON neural diffusion models. Upload your picture once, select any garment from the store, and see exact real-time drape, fit, and contouring.
              </p>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="border border-neutral-800 p-4 rounded-2xl bg-neutral-900/50">
                  <span className="text-2xl font-bold font-['Syne'] text-white">100%</span>
                  <p className="text-xs text-stone-400 mt-1">Private & secure personal photo processing</p>
                </div>
                <div className="border border-neutral-800 p-4 rounded-2xl bg-neutral-900/50">
                  <span className="text-2xl font-bold font-['Syne'] text-amber-400">&lt; 30s</span>
                  <p className="text-xs text-stone-400 mt-1">Average diffusion generation time</p>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  to="/tryon"
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-white text-neutral-950 text-xs font-extrabold uppercase tracking-wider hover:bg-stone-200 transition shadow-lg"
                >
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Start Virtual Try-On</span>
                </Link>
              </div>
            </div>

            {/* Interactive Showcase Graphic */}
            <div className="relative mx-auto max-w-sm rounded-2xl overflow-hidden border border-neutral-800 shadow-2xl bg-neutral-900 p-3">
              <img
                src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&auto=format&fit=crop&q=80"
                alt="AI Try On Showcase"
                className="w-full h-80 object-cover rounded-xl"
              />
              <div className="mt-3 flex items-center justify-between px-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="font-semibold text-stone-200">IDM-VTON Active</span>
                </div>
                <span className="text-stone-500">Auto-Masking ON</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-stone-400">Top Trending</span>
            <h2 className="font-['Syne'] text-2xl sm:text-3xl font-black text-neutral-950 mt-1">
              New Drops & Essentials
            </h2>
          </div>
          <Link to="/shop" className="text-xs font-bold text-stone-600 hover:text-neutral-950 flex items-center gap-1 transition">
            Browse All Styles <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="aspect-[3/4] bg-stone-200 rounded-2xl animate-pulse"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {featuredProducts.map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
