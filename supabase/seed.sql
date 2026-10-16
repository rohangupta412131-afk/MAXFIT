-- ============================================================================
-- MAXFIT E-Commerce Seed Data: Categories, Products, Variants, Size Charts, Coupons
-- ============================================================================

-- Categories
INSERT INTO public.categories (id, name, slug, image_url) VALUES
('c0000000-0000-0000-0000-000000000001', 'T-Shirts & Polos', 't-shirts-polos', 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80'),
('c0000000-0000-0000-0000-000000000002', 'Shirts & Formals', 'shirts-formals', 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&auto=format&fit=crop&q=80'),
('c0000000-0000-0000-0000-000000000003', 'Hoodies & Sweatshirts', 'hoodies-sweatshirts', 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=80'),
('c0000000-0000-0000-0000-000000000004', 'Jackets & Outerwear', 'jackets-outerwear', 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&auto=format&fit=crop&q=80')
ON CONFLICT (id) DO NOTHING;

-- Size Chart for T-Shirts & Polos
INSERT INTO public.size_chart (category_id, size, chest_cm, waist_cm, hip_cm, height_min, height_max) VALUES
('c0000000-0000-0000-0000-000000000001', 'XS', 86, 74, 88, 155, 165),
('c0000000-0000-0000-0000-000000000001', 'S', 92, 80, 94, 160, 172),
('c0000000-0000-0000-0000-000000000001', 'M', 98, 86, 100, 168, 178),
('c0000000-0000-0000-0000-000000000001', 'L', 104, 92, 106, 175, 185),
('c0000000-0000-0000-0000-000000000001', 'XL', 112, 100, 114, 178, 190),
('c0000000-0000-0000-0000-000000000001', 'XXL', 120, 108, 122, 180, 195);

-- Size Chart for Shirts & Formals
INSERT INTO public.size_chart (category_id, size, chest_cm, waist_cm, hip_cm, height_min, height_max) VALUES
('c0000000-0000-0000-0000-000000000002', 'XS', 88, 76, 90, 155, 165),
('c0000000-0000-0000-0000-000000000002', 'S', 94, 82, 96, 160, 172),
('c0000000-0000-0000-0000-000000000002', 'M', 100, 88, 102, 168, 178),
('c0000000-0000-0000-0000-000000000002', 'L', 106, 94, 108, 175, 185),
('c0000000-0000-0000-0000-000000000002', 'XL', 114, 102, 116, 178, 190),
('c0000000-0000-0000-0000-000000000002', 'XXL', 122, 110, 124, 180, 195);

-- Size Chart for Hoodies & Sweatshirts
INSERT INTO public.size_chart (category_id, size, chest_cm, waist_cm, hip_cm, height_min, height_max) VALUES
('c0000000-0000-0000-0000-000000000003', 'XS', 90, 76, 90, 155, 165),
('c0000000-0000-0000-0000-000000000003', 'S', 96, 82, 96, 160, 172),
('c0000000-0000-0000-0000-000000000003', 'M', 102, 88, 102, 168, 178),
('c0000000-0000-0000-0000-000000000003', 'L', 108, 94, 108, 175, 185),
('c0000000-0000-0000-0000-000000000003', 'XL', 116, 102, 116, 178, 190),
('c0000000-0000-0000-0000-000000000003', 'XXL', 124, 110, 124, 180, 195);

-- Size Chart for Jackets & Outerwear
INSERT INTO public.size_chart (category_id, size, chest_cm, waist_cm, hip_cm, height_min, height_max) VALUES
('c0000000-0000-0000-0000-000000000004', 'XS', 92, 78, 92, 155, 165),
('c0000000-0000-0000-0000-000000000004', 'S', 98, 84, 98, 160, 172),
('c0000000-0000-0000-0000-000000000004', 'M', 104, 90, 104, 168, 178),
('c0000000-0000-0000-0000-000000000004', 'L', 110, 96, 110, 175, 185),
('c0000000-0000-0000-0000-000000000004', 'XL', 118, 104, 118, 178, 190),
('c0000000-0000-0000-0000-000000000004', 'XXL', 126, 112, 126, 180, 195);

-- Coupons
INSERT INTO public.coupons (id, code, type, value, min_order, max_discount, expires_at, is_active) VALUES
('e0000000-0000-0000-0000-000000000001', 'WELCOME10', 'percent', 10.00, 499.00, 500.00, NOW() + INTERVAL '180 days', true),
('e0000000-0000-0000-0000-000000000002', 'FLAT200', 'flat', 200.00, 1499.00, 200.00, NOW() + INTERVAL '90 days', true),
('e0000000-0000-0000-0000-000000000003', 'MAXFIT30', 'percent', 30.00, 2999.00, 1000.00, NOW() + INTERVAL '60 days', true)
ON CONFLICT (id) DO NOTHING;
