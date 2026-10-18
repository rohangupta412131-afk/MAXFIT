-- ============================================================================
-- MAXFIT MEN'S-ONLY CATALOG MIGRATION
-- Migration: 20260418000000_mens_only_catalog.sql
-- ============================================================================

-- 1. Remove gender from products
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_gender_check;
ALTER TABLE public.products DROP COLUMN IF EXISTS gender CASCADE;

-- 2. Update price check on products (strictly > 0) and ensure mrp >= price
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_price_check;
ALTER TABLE public.products ADD CONSTRAINT products_price_check CHECK (price > 0);

ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_check;
ALTER TABLE public.products ADD CONSTRAINT products_check CHECK (mrp >= price);

-- 3. Add is_featured, is_new to products
ALTER TABLE public.products 
    ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS is_new BOOLEAN NOT NULL DEFAULT false;

-- 4. Clean up any legacy XS variants and size_chart entries
DELETE FROM public.cart_items WHERE variant_id IN (SELECT id FROM public.product_variants WHERE size = 'XS');
DELETE FROM public.product_variants WHERE size = 'XS';
DELETE FROM public.size_chart WHERE size = 'XS';

-- 5. Update product_variants:
-- - Support tops (S, M, L, XL, XXL) and bottoms (28, 30, 32, 34, 36, 38)
-- - low_stock_threshold (default 5)
-- - UNIQUE(product_id, size, color)
ALTER TABLE public.product_variants DROP CONSTRAINT IF EXISTS product_variants_size_check;
ALTER TABLE public.product_variants ADD CONSTRAINT product_variants_size_check 
    CHECK (size IN ('S', 'M', 'L', 'XL', 'XXL', '28', '30', '32', '34', '36', '38'));

ALTER TABLE public.product_variants 
    ADD COLUMN IF NOT EXISTS low_stock_threshold INT NOT NULL DEFAULT 5 CHECK (low_stock_threshold >= 0);

ALTER TABLE public.product_variants DROP CONSTRAINT IF EXISTS uq_product_variants_size_color;
ALTER TABLE public.product_variants ADD CONSTRAINT uq_product_variants_size_color 
    UNIQUE (product_id, size, color);

-- 6. Update categories: add size_type ('top' | 'bottom') and sort_order
ALTER TABLE public.categories 
    ADD COLUMN IF NOT EXISTS size_type TEXT NOT NULL DEFAULT 'top' CHECK (size_type IN ('top', 'bottom')),
    ADD COLUMN IF NOT EXISTS sort_order INT NOT NULL DEFAULT 0;

-- 7. Update size_chart: add size_type and inseam_cm, update size check
ALTER TABLE public.size_chart 
    ADD COLUMN IF NOT EXISTS size_type TEXT NOT NULL DEFAULT 'top' CHECK (size_type IN ('top', 'bottom')),
    ADD COLUMN IF NOT EXISTS inseam_cm NUMERIC(5,2);

ALTER TABLE public.size_chart DROP CONSTRAINT IF EXISTS size_chart_size_check;
ALTER TABLE public.size_chart ADD CONSTRAINT size_chart_size_check 
    CHECK (size IN ('S', 'M', 'L', 'XL', 'XXL', '28', '30', '32', '34', '36', '38'));

-- Ensure RLS remains enabled on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tryon_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.size_chart ENABLE ROW LEVEL SECURITY;
