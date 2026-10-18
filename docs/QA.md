# MAXFIT Full-Stack D2C & AI Virtual Try-On - Manual QA Checklist

This checklist provides step-by-step verification procedures for testing MAXFIT end-to-end, covering the complete customer journey, virtual try-on diffusion pipeline, checkout, and admin console.

---

## 1. Authentication & Profile
- [ ] **Sign Up**: Navigate to `/signup`, register a new user with full name, email, phone, and password. Confirm instant redirect and profile creation.
- [ ] **Sign In**: Navigate to `/login`, sign in with valid credentials. Verify user initials badge appears in Navbar.
- [ ] **Profile & Biometrics**: Go to `/profile`. Enter height (e.g., 178 cm) and weight (e.g., 72 kg). Save changes. Verify fields persist across refreshes.
- [ ] **Saved Addresses**: Under `/profile`, add a new shipping address with a 6-digit PIN code. Verify the card renders in the address book.
- [ ] **Sign Out**: Click user avatar -> "Sign Out". Confirm session is cleared.

---

## 2. Storefront, Catalog & Filtering
- [ ] **Home Page**: Verify hero banner, curated category cards, AI try-on promo banner, and new arrival products render.
- [ ] **Shop Catalog**: Go to `/shop`.
  - Filter by category (e.g. "Hoodies and Sweatshirt", "Checks Shirt").
  - Filter by size (tops S-XXL, bottoms 28-38) and price range.
  - Toggle "In-Stock Only".
  - Sort by Price: Low to High, High to Low, and Newest.
- [ ] **Search**: Use Navbar search bar to search "Heavyweight". Verify URL query synchronizes and matching products appear.

---

## 3. Product Detail & Sizing
- [ ] **Product Page**: Click any product (e.g. `Aura Oversized Heavyweight Tee`).
- [ ] **Image Gallery**: Hover or click thumbnail images to switch the main display view.
- [ ] **Size Selection & Stock**: Click through sizes (XS, S, M, L, XL, XXL).
  - Observe dynamic stock labels: "In Stock & Ready to Ship" or "Only N left in stock".
- [ ] **Size Guide**: Click "Size Guide" to view the category measurement chart (chest, waist, hip, height in cm).
- [ ] **AI Size Recommender**: Click "Recommend My Size".
  - Observe pre-filled height & weight from profile.
  - Choose fit style ("Slim", "Regular", "Relaxed").
  - Click "Find My Best Fit". Verify recommended size, confidence badge, and explanation.
  - Click "Select Size" to auto-select that size on the product page.
- [ ] **Add to Bag**: Select quantity and click "Add to Bag". Confirm cart badge updates globally in the Navbar.

---

## 4. Bag & Coupon Engine
- [ ] **Bag Page**: Navigate to `/cart`.
- [ ] **Quantity Stepper**: Increase and decrease item quantity. Verify quantity cannot exceed available stock.
- [ ] **Apply Coupons**:
  - Test `WELCOME10`: 10% discount applied up to ₹500 cap.
  - Test `FLAT200`: Flat ₹200 discount applied (on min order ₹1,499).
  - Test invalid code: Friendly error toast displayed.
- [ ] **Order Summary**: Verify subtotal, discount, shipping fee (Free > ₹999, else ₹79), and GST breakdown.

---

## 5. Checkout & Razorpay Test Payment
- [ ] **Proceed to Checkout**: Click "Proceed to Checkout" from bag (or "Buy Now" on product detail).
- [ ] **Delivery Address**: Select saved address or click "Add New" with 6-digit PIN code validation.
- [ ] **Payment Step**: Click "Pay Now".
- [ ] **Razorpay Modal**: Razorpay Checkout opens with pre-filled customer details and exact amount.
- [ ] **Test Card / UPI**:
  - Use Razorpay Test UPI (`success@razorpay`) or Test Card (`4111 1111 1111 1111`, any future expiry, CVV `123`, OTP `123456`).
  - Complete the mock authorization.
- [ ] **Verification & Order Success**:
  - Backend verifies HMAC SHA256 signature using timing-safe comparison.
  - Stock is atomically decremented.
  - Cart is cleared.
  - Order success page renders with celebratory confetti and unique order reference (e.g. `ORD-2026-001001`).

---

## 6. Orders & PDF Tax Invoices
- [ ] **Orders List**: Navigate to `/orders`. Confirm newly placed order is listed with "PAID" badge.
- [ ] **Order Details**: Click "Order Details". Review snapshotted item prices, sizes, and shipping address.
- [ ] **Download Invoice**: Click "Tax Invoice (PDF)". Verify PDF invoice downloads with:
  - Brand header, GSTIN, invoice number, and date.
  - Itemized table with quantities, sizes, and unit prices.
  - GST breakdown and grand total.
- [ ] **Cancel Order**: Click "Cancel Order" on a paid order. Confirm stock is restored and refund is initiated.

---

## 7. AI Virtual Try-On (IDM-VTON)
- [ ] **Access Studio**: Click "AI Try-On Studio" in Navbar or "Virtual Try-On" on a product.
- [ ] **Step 1 - Select Garment**: Choose a try-on compatible garment.
- [ ] **Step 2 - Upload Photo**: Upload a clear, front-facing standing photo (JPEG/PNG/WEBP).
  - Observe client-side canvas compression down to ~768x1024.
- [ ] **Step 3 - Synthesize**: Click "Synthesize Virtual Try-On".
  - Watch progress updates ("Uploading photo securely...", "Initializing IDM-VTON pipeline...", "Fitting garment geometry...").
  - Observe asynchronous processing via polling.
- [ ] **Step 4 - Interactive Result**:
  - Drag the interactive **Before/After Slider** horizontally to inspect garment fit vs. original photo.
  - Click "Download High-Res" to save the generated image.
  - Select size and click "Add this fit to Bag".
- [ ] **My Saved Fits**: Click "My Saved Fits" tab to view past try-on jobs. Click the trash icon to test permanent removal.

---

## 8. Admin Console
- [ ] **Access Console**: Log in as an admin account and navigate to `/admin`.
- [ ] **Overview Tab**: Verify real-time stats: Total Revenue, Orders Today, Pending Checkout, Low-Stock Alerts, and Try-On Success Rate.
- [ ] **Products Manager**: Add or edit a product, manage variants, and toggle `tryon_enabled`.
- [ ] **Orders Manager**: Filter orders by status and update order status (Processing -> Shipped -> Delivered).
- [ ] **Coupons Manager**: Create and delete promo coupons.
