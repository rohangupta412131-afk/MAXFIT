import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, X, ChevronDown, Sparkles, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import { api } from '../config/api';
import { ProductCard } from '../components/product/ProductCard';

export const Shop = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Active filters from URL
  const selectedCategory = searchParams.get('category') || '';
  const selectedGender = searchParams.get('gender') || '';
  const selectedSize = searchParams.get('size') || '';
  const selectedSort = searchParams.get('sort') || 'newest';
  const searchQuery = searchParams.get('search') || '';
  const inStockOnly = searchParams.get('in_stock') === 'true';
  const currentPage = parseInt(searchParams.get('page') || '1', 10);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams(searchParams);
      if (!query.has('page')) query.set('page', '1');
      if (!query.has('limit')) query.set('limit', '12');

      const res = await api.get(`/products?${query.toString()}`);
      if (res.success && res.data) {
        setProducts(res.data.products || []);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.warn('Shop product fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    api.get('/categories').then(res => {
      if (res.data) setCategories(res.data);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    fetchProducts();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [fetchProducts]);

  const updateFilter = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    next.set('page', '1'); // reset page on filter change
    setSearchParams(next);
  };

  const clearAllFilters = () => {
    setSearchParams({});
  };

  const hasActiveFilters = !!(selectedCategory || selectedGender || selectedSize || searchQuery || inStockOnly);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header and Title */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-stone-200 pb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-stone-400">Catalogue</span>
          <h1 className="font-['Syne'] text-3xl sm:text-4xl font-black text-neutral-950 mt-1">
            {searchQuery ? `Search results for "${searchQuery}"` : 'All Apparel & Outerwear'}
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Showing {products.length} of {pagination.total} styles engineered for form & fit
          </p>
        </div>

        {/* Sorting & Filter Trigger */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
            className="md:hidden flex items-center gap-2 px-4 py-2 bg-stone-100 rounded-full text-xs font-bold text-neutral-900 border border-stone-200"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filters {hasActiveFilters && '•'}</span>
          </button>

          <div className="flex items-center gap-2 bg-stone-100 rounded-full px-4 py-2 border border-stone-200 text-xs font-medium text-stone-700">
            <ArrowUpDown className="w-3.5 h-3.5 text-stone-400" />
            <select
              value={selectedSort}
              onChange={(e) => updateFilter('sort', e.target.value)}
              className="bg-transparent focus:outline-none font-semibold text-neutral-950 cursor-pointer"
            >
              <option value="newest">Newest Releases</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Layout (Sidebar + Grid) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Desktop Filter Sidebar */}
        <div className="hidden md:block space-y-6 text-sm">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-neutral-950 uppercase tracking-wider text-xs">Filter Products</h3>
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="text-xs text-stone-500 hover:text-neutral-950 underline font-semibold"
              >
                Clear All
              </button>
            )}
          </div>

          {/* Category Filter */}
          <div className="space-y-2 border-b border-stone-200 pb-5">
            <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider">Categories</h4>
            <div className="flex flex-col gap-1.5">
              <button
                onClick={() => updateFilter('category', '')}
                className={`text-left text-xs py-1 transition ${!selectedCategory ? 'font-bold text-neutral-950' : 'text-stone-500 hover:text-neutral-900'}`}
              >
                All Categories
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => updateFilter('category', c.slug)}
                  className={`text-left text-xs py-1 transition ${selectedCategory === c.slug ? 'font-bold text-neutral-950' : 'text-stone-500 hover:text-neutral-900'}`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Gender Filter */}
          <div className="space-y-2 border-b border-stone-200 pb-5">
            <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider">Gender</h4>
            <div className="flex flex-col gap-1.5">
              {[
                { id: '', label: 'All Genders' },
                { id: 'men', label: "Men's" },
                { id: 'women', label: "Women's" },
                { id: 'unisex', label: 'Unisex' }
              ].map((g) => (
                <button
                  key={g.id}
                  onClick={() => updateFilter('gender', g.id)}
                  className={`text-left text-xs py-1 transition ${selectedGender === g.id ? 'font-bold text-neutral-950' : 'text-stone-500 hover:text-neutral-900'}`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          {/* Size Filter */}
          <div className="space-y-2 border-b border-stone-200 pb-5">
            <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider">Size</h4>
            <div className="grid grid-cols-3 gap-1.5">
              {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map((sz) => (
                <button
                  key={sz}
                  onClick={() => updateFilter('size', selectedSize === sz ? '' : sz)}
                  className={`py-2 text-xs font-bold rounded-xl border transition ${
                    selectedSize === sz
                      ? 'bg-neutral-950 text-white border-neutral-950 shadow-sm'
                      : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  {sz}
                </button>
              ))}
            </div>
          </div>

          {/* In-Stock Only Toggle */}
          <div className="pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => updateFilter('in_stock', e.target.checked ? 'true' : '')}
                className="rounded border-stone-300 text-neutral-950 focus:ring-0"
              />
              <span className="text-xs font-semibold text-stone-700">In-Stock Only</span>
            </label>
          </div>
        </div>

        {/* Product Grid Area */}
        <div className="md:col-span-3">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="aspect-[3/4] bg-stone-200 rounded-2xl animate-pulse"></div>
              ))}
            </div>
          ) : products.length > 0 ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
                {products.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>

              {/* Pagination Controls */}
              {pagination.totalPages > 1 && (
                <div className="mt-12 flex items-center justify-center gap-2">
                  <button
                    disabled={currentPage <= 1}
                    onClick={() => updateFilter('page', (currentPage - 1).toString())}
                    className="px-4 py-2 rounded-full border border-stone-200 text-xs font-bold text-stone-700 hover:bg-stone-100 disabled:opacity-40 transition"
                  >
                    Previous
                  </button>

                  <div className="flex items-center gap-1">
                    {[...Array(pagination.totalPages)].map((_, i) => {
                      const pageNum = i + 1;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => updateFilter('page', pageNum.toString())}
                          className={`w-8 h-8 rounded-full text-xs font-bold transition ${
                            currentPage === pageNum
                              ? 'bg-neutral-950 text-white'
                              : 'text-stone-700 hover:bg-stone-100'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    disabled={currentPage >= pagination.totalPages}
                    onClick={() => updateFilter('page', (currentPage + 1).toString())}
                    className="px-4 py-2 rounded-full border border-stone-200 text-xs font-bold text-stone-700 hover:bg-stone-100 disabled:opacity-40 transition"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="py-20 text-center space-y-4 bg-white rounded-3xl border border-stone-200 p-8">
              <div className="w-12 h-12 rounded-full bg-stone-100 mx-auto flex items-center justify-center text-stone-400">
                <Filter className="w-6 h-6" />
              </div>
              <h3 className="font-['Syne'] text-lg font-bold text-neutral-900">No styles found</h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                We couldn't find any products matching your active filters. Try clearing some filters.
              </p>
              <button
                onClick={clearAllFilters}
                className="px-5 py-2.5 rounded-full bg-neutral-950 text-white text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 transition shadow-md"
              >
                Reset All Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
