-- ============================================================================
-- MAX-FIT: Complete Production Database Schema
-- Architecture: Direct-to-Customer Men's Apparel Platform with AI Virtual Try-On
-- ============================================================================

-- Enable pgcrypto for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. USER PROFILES
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
    height_cm NUMERIC(5,2),
    weight_kg NUMERIC(5,2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Trigger to create profile automatically on auth.users insert
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, phone, role)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
        COALESCE(new.raw_user_meta_data->>'phone', ''),
        COALESCE(new.raw_user_meta_data->>'role', 'customer')
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 2. CATEGORIES
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    size_type TEXT NOT NULL DEFAULT 'top' CHECK (size_type IN ('top', 'bottom')),
    sort_order INT NOT NULL DEFAULT 0,
    image_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ============================================================================
-- 3. PRODUCTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    price NUMERIC(10,2) NOT NULL CHECK (price > 0),
    mrp NUMERIC(10,2) NOT NULL CHECK (mrp >= price),
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    fabric TEXT,
    care_instructions TEXT,
    images TEXT[] NOT NULL DEFAULT '{}',
    garment_image TEXT,
    garment_des TEXT,
    tryon_enabled BOOLEAN NOT NULL DEFAULT true,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    is_new BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_products_slug_category ON public.products(slug, category_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_featured ON public.products(is_featured);

-- ============================================================================
-- 4. PRODUCT VARIANTS (SKUs & INVENTORY)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    size TEXT NOT NULL CHECK (size IN ('S', 'M', 'L', 'XL', 'XXL', '28', '30', '32', '34', '36', '38')),
    color TEXT NOT NULL,
    sku TEXT NOT NULL UNIQUE,
    stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
    low_stock_threshold INT NOT NULL DEFAULT 5 CHECK (low_stock_threshold >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_product_variants_size_color UNIQUE (product_id, size, color)
);

CREATE INDEX IF NOT EXISTS idx_variants_product ON public.product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_variants_stock ON public.product_variants(stock);

-- ============================================================================
-- 5. ADDRESSES
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    line1 TEXT NOT NULL,
    line2 TEXT,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    pincode VARCHAR(6) NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_addresses_user ON public.addresses(user_id);

-- ============================================================================
-- 6. CART ITEMS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
    qty INT NOT NULL DEFAULT 1 CHECK (qty > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_cart_user_variant UNIQUE(user_id, variant_id)
);

CREATE INDEX IF NOT EXISTS idx_cart_user ON public.cart_items(user_id);

-- ============================================================================
-- 7. WISHLIST ITEMS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.wishlist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_wishlist_user_product UNIQUE(user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_wishlist_user ON public.wishlist_items(user_id);

-- ============================================================================
-- 8. COUPONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL CHECK (type IN ('percent', 'flat')),
    value NUMERIC(10,2) NOT NULL CHECK (value > 0),
    min_order NUMERIC(10,2) NOT NULL DEFAULT 0,
    max_discount NUMERIC(10,2),
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ============================================================================
-- 9. ORDERS & SEQUENCE
-- ============================================================================
CREATE SEQUENCE IF NOT EXISTS order_number_seq START WITH 1001;

CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TEXT AS $$
DECLARE
    next_val BIGINT;
    year_str TEXT;
BEGIN
    next_val := nextval('order_number_seq');
    year_str := to_char(CURRENT_DATE, 'YYYY');
    RETURN 'ORD-' || year_str || '-' || lpad(next_val::text, 6, '0');
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT NOT NULL UNIQUE DEFAULT public.generate_order_number(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
    subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
    discount NUMERIC(10,2) NOT NULL DEFAULT 0,
    shipping_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
    tax NUMERIC(10,2) NOT NULL DEFAULT 0,
    total NUMERIC(10,2) NOT NULL DEFAULT 0,
    coupon_code TEXT,
    shipping_address JSONB NOT NULL,
    razorpay_order_id TEXT,
    razorpay_payment_id TEXT,
    payment_status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_orders_user ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);

-- ============================================================================
-- 10. ORDER ITEMS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    size TEXT NOT NULL,
    color TEXT NOT NULL,
    qty INT NOT NULL CHECK (qty > 0),
    unit_price NUMERIC(10,2) NOT NULL,
    image TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);

-- ============================================================================
-- 11. TRYON JOBS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.tryon_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    person_path TEXT NOT NULL,
    result_path TEXT,
    status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'done', 'failed')),
    error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_tryon_jobs_user ON public.tryon_jobs(user_id);

-- ============================================================================
-- 12. SIZE CHART
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.size_chart (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
    size_type TEXT NOT NULL DEFAULT 'top' CHECK (size_type IN ('top', 'bottom')),
    size TEXT NOT NULL CHECK (size IN ('S', 'M', 'L', 'XL', 'XXL', '28', '30', '32', '34', '36', '38')),
    chest_cm NUMERIC(5,2),
    waist_cm NUMERIC(5,2),
    hip_cm NUMERIC(5,2),
    inseam_cm NUMERIC(5,2),
    height_min NUMERIC(5,2),
    height_max NUMERIC(5,2)
);

CREATE INDEX IF NOT EXISTS idx_size_chart_category ON public.size_chart(category_id);

-- ============================================================================
-- ATOMIC INVENTORY STORED FUNCTIONS
-- ============================================================================

-- Decrement variant stock with pessimistic row lock
CREATE OR REPLACE FUNCTION public.decrement_variant_stock(p_variant_id UUID, p_qty INT)
RETURNS BOOLEAN AS $$
DECLARE
    current_stock INT;
BEGIN
    SELECT stock INTO current_stock
    FROM public.product_variants
    WHERE id = p_variant_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Variant not found';
    END IF;

    IF current_stock < p_qty THEN
        RETURN FALSE;
    END IF;

    UPDATE public.product_variants
    SET stock = stock - p_qty
    WHERE id = p_variant_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Restore stock upon cancellation or expiration
CREATE OR REPLACE FUNCTION public.restore_variant_stock(p_variant_id UUID, p_qty INT)
RETURNS VOID AS $$
BEGIN
    UPDATE public.product_variants
    SET stock = stock + p_qty
    WHERE id = p_variant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

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

-- Helper function to check administrator status
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles Policies
CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id OR public.is_admin());
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Public Read Catalog Tables (categories, products, variants, size_chart, coupons)
CREATE POLICY "Public read categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admin write categories" ON public.categories FOR ALL USING (public.is_admin());

CREATE POLICY "Public read products" ON public.products FOR SELECT USING (is_active = true OR public.is_admin());
CREATE POLICY "Admin write products" ON public.products FOR ALL USING (public.is_admin());

CREATE POLICY "Public read variants" ON public.product_variants FOR SELECT USING (true);
CREATE POLICY "Admin write variants" ON public.product_variants FOR ALL USING (public.is_admin());

CREATE POLICY "Public read size_chart" ON public.size_chart FOR SELECT USING (true);
CREATE POLICY "Admin write size_chart" ON public.size_chart FOR ALL USING (public.is_admin());

CREATE POLICY "Public read active coupons" ON public.coupons FOR SELECT USING (is_active = true OR public.is_admin());
CREATE POLICY "Admin write coupons" ON public.coupons FOR ALL USING (public.is_admin());

-- User-Specific Data Policies
CREATE POLICY "User addresses access" ON public.addresses FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "User cart access" ON public.cart_items FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "User wishlist access" ON public.wishlist_items FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "User orders access" ON public.orders FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "User orders insert" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admin or user update orders" ON public.orders FOR UPDATE USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "User order items access" ON public.order_items FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND (orders.user_id = auth.uid() OR public.is_admin()))
);

CREATE POLICY "User tryon jobs access" ON public.tryon_jobs FOR ALL USING (auth.uid() = user_id OR public.is_admin());

-- ============================================================================
-- STORAGE BUCKETS & POLICIES
-- ============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('products', 'products', true),
    ('tryon-uploads', 'tryon-uploads', false),
    ('tryon-results', 'tryon-results', false),
    ('invoices', 'invoices', false)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

-- Storage RLS Policies
CREATE POLICY "Public read products bucket" ON storage.objects FOR SELECT USING (bucket_id = 'products');
CREATE POLICY "Admin upload products bucket" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'products' AND (public.is_admin() OR auth.role() = 'service_role'));

CREATE POLICY "User read own tryon uploads" ON storage.objects FOR SELECT USING (bucket_id = 'tryon-uploads' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.is_admin() OR auth.role() = 'service_role'));
CREATE POLICY "User upload own tryon uploads" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'tryon-uploads' AND (auth.uid()::text = (storage.foldername(name))[1] OR auth.role() = 'service_role'));
CREATE POLICY "User delete own tryon uploads" ON storage.objects FOR DELETE USING (bucket_id = 'tryon-uploads' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.is_admin() OR auth.role() = 'service_role'));

CREATE POLICY "User read own tryon results" ON storage.objects FOR SELECT USING (bucket_id = 'tryon-results' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.is_admin() OR auth.role() = 'service_role'));
CREATE POLICY "Service write tryon results" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'tryon-results' AND auth.role() = 'service_role');
CREATE POLICY "User delete own tryon results" ON storage.objects FOR DELETE USING (bucket_id = 'tryon-results' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.is_admin() OR auth.role() = 'service_role'));

CREATE POLICY "User read own invoices" ON storage.objects FOR SELECT USING (bucket_id = 'invoices' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.is_admin() OR auth.role() = 'service_role'));
CREATE POLICY "Service write invoices" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'invoices' AND auth.role() = 'service_role');

-- ============================================================================
-- REALTIME REPLICATION CONFIGURATION
-- ============================================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.tryon_jobs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
