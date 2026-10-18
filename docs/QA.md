# MAX-FIT Manual QA Verification Checklist

This checklist defines step-by-step verification procedures for testing MAX-FIT end-to-end, covering customer navigation, biometric sizing, virtual try-on diffusion, checkout with Razorpay test mode, order tracking, and the administrative console.

---

## 1. Authentication & Fit Profile
- [ ] **Sign Up**: Navigate to `/signup`, register a new user with full name, email, phone, and password. Confirm immediate redirection and automatic profile initialization.
- [ ] **Sign In**: Navigate to `/login`, sign in with valid credentials. Verify user avatar badge appears in the Navbar.
- [ ] **Fit Profile & Biometrics**: Go to `/profile`. Enter height (e.g., 178 cm), weight (e.g., 74 kg), and optional chest/waist measurements. Save changes and verify values persist on refresh.
- [ ] **Saved Addresses**: Under `/profile`, add a new shipping address with a 6-digit PIN code. Verify the card renders in the address book with the option to set as default.
- [ ] **Sign Out**: Click the user menu and select "Sign Out". Confirm the authentication session terminates and protected routes redirect to `/login`.

---

## 2. Storefront, Catalog & Multi-Facet Filtering
- [ ] **Home Page**: Verify hero banner, category cards for all 7 men's categories, AI Try-On promotional banner, and new arrival products.
- [ ] **Shop Catalog**: Go to `/shop`.
  - Filter by category: `Cargo`, `Casual Shirts`, `Checks Shirt`, `Hoodies and Sweatshirt`, `Men's Jacket`, `Pants Jeans`, `T-shirt`.
  - Filter by size: tops (`S`, `M`, `L`, `XL`, `XXL`) and bottoms (`28`, `30`, `32`, `34`, `36`, `38`).
  - Filter by price range slider (₹499 to ₹1,299).
  - Toggle "In-Stock Only" filter.
  - Sort by Price: Low to High, High to Low, and Newest.
- [ ] **Search**: Use the Navbar search bar to search for garments (e.g., "Oxford", "Denim", "Cargo"). Verify URL query parameters synchronize and matching items render.

---

## 3. Product Detail, Sizing & Direct Purchase
- [ ] **Product Page**: Click any garment (e.g. `Khaki Brushed Cotton Utility Work Shirt` or `Charcoal Slate Tactical Heavyweight Cargo`).
- [ ] **Image Gallery**: Hover or click thumbnail images to switch the active view.
- [ ] **Size Selection & Live Stock**: Select sizes appropriate for the category (`S-XXL` for shirts; `28-38` for pants).
  - Confirm stock counters update dynamically ("In Stock & Ready to Ship" or "Only N left in stock").
- [ ] **Category Size Guide**: Click "Size Guide" to view the category measurement chart (chest, waist, hip, height in centimeters).
- [ ] **AI Biometric Size Recommender**: Click "Recommend My Size".
  - Observe pre-filled height and weight from customer profile.
  - Choose fit style (`Slim`, `Regular`, `Relaxed`).
  - Click "Find My Best Fit" to receive size recommendation, confidence score, and fit rationale.
  - Click "Select Size" to auto-select that variant on the product page.
- [ ] **Add to Bag**: Select quantity and click "Add to Bag". Confirm the bag badge counter in the Navbar increments.
- [ ] **Direct "Buy Now"**: Select an in-stock size and click "Buy Now". Confirm immediate navigation to `/checkout?buyNowVariantId=...&buyNowQty=1`.

---

## 4. Shopping Bag & Promotional Coupons
- [ ] **Bag Page**: Navigate to `/cart`.
- [ ] **Quantity Stepper**: Increase and decrease item quantity. Verify the counter cannot exceed available variant stock.
- [ ] **Promotional Coupon Testing**:
  - Test `WELCOME10`: 10% discount applied up to the ₹150 cap (minimum order ₹499).
  - Test `FLAT200`: Flat ₹200 discount applied (minimum order ₹1,299).
  - Test `MAXFIT30`: 30% discount applied up to the ₹1,000 cap (minimum order ₹2,999).
  - Test invalid code: Verify user receives an informative error notification.
- [ ] **Price Summary**: Verify subtotal, coupon discount, shipping fee (Free for orders ₹999 and above; ₹79 otherwise), and dual-tier GST breakdown (5% apparel GST under ₹1,000; 12% GST at ₹1,000 and above).

---

## 5. Checkout & Razorpay Test Payment
- [ ] **Proceed to Checkout**: Navigate to `/checkout` via bag or via "Buy Now".
- [ ] **Buy Now Item Preview**: If checking out via "Buy Now", verify single-item summary card displays garment photo, title, selected size, quantity, and accurate non-zero total.
- [ ] **Delivery Address**: Select an existing shipping address or click "Add New" with 6-digit PIN validation.
- [ ] **Payment Step**: Click "Pay Now".
- [ ] **Razorpay Checkout Modal**: Modal opens with pre-filled customer details and the exact total amount in INR.
- [ ] **Test Card / UPI Payment**:
  - Use Razorpay Test UPI (`success@razorpay`) or Test Card (`4111 1111 1111 1111`, any future expiry, CVV `123`, OTP `123456`).
  - Complete the authorization.
- [ ] **Verification & Order Confirmation**:
  - Backend verifies HMAC SHA256 signature using timing-safe comparison.
  - Variant stock is atomically decremented.
  - Shopping bag resets to empty (for cart checkout).
  - Order success screen renders with celebratory confetti animation and unique reference (e.g. `ORD-2026-001001`).

---

## 6. Order Tracking, Delivery Status & PDF Tax Invoices
- [ ] **Orders List**: Navigate to `/orders`. Confirm placed orders appear with current status badge.
- [ ] **4-Stage Delivery Tracker**: Click "Order Details" (`/orders/:id`). Verify visual tracking stepper:
  - Stage 1: Order Placed
  - Stage 2: Ready to be Shipped
  - Stage 3: In Transit
  - Stage 4: Delivered
- [ ] **Payment Retry**: For any order in `pending` payment status, verify the "Complete Payment" button opens the Razorpay modal to finalize payment.
- [ ] **Download Tax Invoice**: Click "Tax Invoice (PDF)". Verify the vector PDF invoice downloads with:
  - MAX-FIT brand header, invoice reference, and date.
  - Itemized table with quantities, sizes, unit prices, and line totals.
  - GST tax breakdown and total payable amount.
- [ ] **Order Cancellation**: Click "Cancel Order" on an eligible order. Confirm status updates to `cancelled` and variant stock is restored in the database.

---

## 7. AI Virtual Try-On Studio (IDM-VTON)
- [ ] **Access Studio**: Click "AI Try-On Studio" in the Navbar or "Virtual Try-On" from a product page.
- [ ] **Step 1 - Select Garment**: Choose any upper garment compatible with virtual try-on.
- [ ] **Step 2 - Upload Photo**: Upload a clear, front-facing standing photo (JPEG, PNG, or WEBP).
  - Confirm client-side canvas compression down to ~768 × 1024.
- [ ] **Step 3 - Synthesize**: Click "Synthesize Virtual Try-On".
  - Observe progress indicators ("Uploading photo securely...", "Initializing IDM-VTON pipeline...", "Fitting garment geometry...").
  - Asynchronous background polling monitors job completion.
- [ ] **Step 4 - Interactive Result**:
  - Drag the interactive **Before/After Split Comparison Slider** horizontally to inspect garment synthesis versus the original photo.
  - Click "Download High-Res" to save the resulting image.
  - Select size and click "Add this fit to Bag".
- [ ] **My Saved Fits**: Click "My Saved Fits" to view past generations. Click the trash icon to verify permanent deletion from storage and database.

---

## 8. Administrative Console (`/admin`)
- [ ] **Access Guard**: Log in with an administrator account and navigate to `/admin`. Verify non-admin accounts are blocked.
- [ ] **Overview Tab**: Verify operational statistics: Total Revenue, Orders Today, Pending Orders, Low-Stock Alerts, and Try-On Success Rate.
- [ ] **Products Manager**:
  - Click "Add New Men's Garment".
  - Verify **"Upload from Computer"** button uploads image directly to Supabase Storage `products` bucket.
  - Review recommended 3:4 portrait resolution guidance card (768 × 1024 minimum; 1200 × 1600 recommended).
  - Select Category: verify variant sizes automatically adapt (Waist `28-38` for Cargo/Pants Jeans; Chest `S-XXL` for tops).
  - Verify AI Virtual Try-On defaults to disabled for bottoms and enabled for tops.
  - Save product and confirm it appears immediately in the store catalog.
- [ ] **Inventory Manager**:
  - Filter inventory by "Low Stock" and "Sold Out".
  - Use inline `+` / `-` buttons to adjust variant inventory.
  - Use Quick Stock Editor modal to update inventory across all sizes for a garment.
- [ ] **Orders & Fulfillment Manager**:
  - Filter orders by status (`pending`, `paid`, `processing`, `shipped`, `delivered`, `cancelled`).
  - Change order delivery status using the dropdown selector and verify the customer's 4-stage tracking stepper updates in real time.
- [ ] **Coupons Manager**:
  - Create a new discount code with discount type (`percent` or `flat`), minimum order amount, and expiration date.
  - Delete an existing coupon and verify it is invalidated immediately.
