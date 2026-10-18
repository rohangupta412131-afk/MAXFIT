# Project Functionality & Feature Specification

## 1. Project Overview

- **Project Name:** MAX-FIT
- **Tagline:** Precision Fit & AI Virtual Try-On for Modern Men's Apparel
- **Category:** Direct-to-Customer (D2C) Men's Fashion E-Commerce Platform
- **Deployment URL (Frontend):** https://maxfit-olive.vercel.app
- **Production API URL (Backend):** https://maxfit-production-771c.up.railway.app/api/v1
- **Tech Stack:**
  - **Frontend:** React 19, Vite 6, Tailwind CSS v4, Lucide Icons, Canvas Confetti
  - **Backend:** Node.js 25, Express (ES Modules), PDFKit, Gradio Client, Multer, Zod, Vitest
  - **Database & Storage:** PostgreSQL 15, Row Level Security (RLS), Supabase Auth & Storage Buckets
  - **AI Inference:** Hugging Face Spaces (`yisol/IDM-VTON`)
  - **Payment Gateway:** Razorpay Payment Gateway API

### Description
**MAX-FIT** is an end-to-end, full-stack direct-to-customer e-commerce web application engineered specifically for men's casual and everyday wear. Designed as a high-performance fashion portal, MAX-FIT bridges the gap between digital shopping and physical retail by combining an intuitive shopping experience with an AI Virtual Try-On studio powered by neural diffusion (`IDM-VTON`). 

The platform features a curated 7-category men's catalog, server-authoritative dual-tier GST billing calculations, atomic inventory management to prevent stock overselling, instant single-item "Buy Now" workflows, biometric size recommendation algorithms, automated PDF tax invoice generation, a 4-stage visual order delivery tracker, and an administrative control panel equipped with direct image upload guidance and live stock adjustments.

---

## 2. Core Functional Modules (Point-by-Point)

### 2.1 Storefront & Catalog Discovery
- **Focused Men's Wear Catalog:** Houses a 62-product catalog distributed across 7 core men's categories:
  1. *Casual Shirts* (17 products, S–XXL)
  2. *Hoodies and Sweatshirt* (15 products, S–XXL)
  3. *Checks Shirt* (9 products, S–XXL)
  4. *Pants Jeans* (8 products, waist sizes 28–38)
  5. *Men's Jacket* (5 products, S–XXL)
  6. *T-shirt* (5 products, S–XXL)
  7. *Cargo* (3 products, waist sizes 28–38)
- **Category Sizing Isolation:** Automatically adapts sizing pickers based on garment anatomy:
  - Upper-body tops display alpha sizing (`S, M, L, XL, XXL`).
  - Lower-body pants and cargo display waist measurements (`28, 30, 32, 34, 36, 38`).
- **Dynamic Filtering & Searching:** Real-time client-side search matching product titles, descriptions, and fabric types. Category selection pills filter products without reloading.
- **Sorting Engine:** Price sorting (low-to-high, high-to-low), newest arrivals, and featured collections.
- **Stock Indicators:** Live badge alerts showing "In Stock", "Only X Left" for low-stock items, and disabled buy buttons for out-of-stock variants.
- **Garment Detail View:** High-resolution product image gallery, detailed care instructions, fabric breakdown, and real-time color and size picker.

---

### 2.2 AI Virtual Try-On Studio (IDM-VTON)
- **Neural Diffusion Fitting:** Integrates `yisol/IDM-VTON` (Identity-Preserving Garment Try-On Diffusion) through Hugging Face Spaces for realistic upper-body cloth rendering.
- **Client-Side Aspect-Ratio Canvas Preprocessor:** Standardizes customer photos to 768×1024 portrait aspect ratio using in-browser HTML5 Canvas letterboxing to eliminate perspective distortion before server dispatch.
- **Targeted Upper-Body Garment Scope:** Virtual try-on is automatically enabled for shirts, jackets, hoodies, and t-shirts, while disabled for bottom-wear pants and cargos.
- **Asynchronous Processing Lifecycle:** Submits non-blocking try-on jobs tracked via the database with status transitions (`processing` &rarr; `done` / `failed`) and live client polling.
- **Interactive Before/After Slider:** Dual-layered split-screen comparison slider allowing customers to slide between their original portrait and the AI-fitted result.
- **Secure File Storage:** Customer portraits and synthesized results are stored in private Supabase storage buckets (`tryon-uploads`, `tryon-results`) protected by Row Level Security.

---

### 2.3 Biometric Size Recommender
- **Anthropometric Estimation:** Customers enter their height (cm) and weight (kg) in an intuitive modal.
- **Size Chart Matching:** Queries category-specific measurement records in the database (`chest_cm`, `waist_cm`, `hip_cm`, `inseam_cm`, and recommended height ranges) to recommend the optimal size (`S` to `XXL` or `28` to `38`).
- **Persistent Profile Storage:** Saves user biometric measurements in the customer profile for instant one-click recommendations across future browsing sessions.

---

### 2.4 Instant "Buy Now" & Shopping Bag System
- **Single-Item "Buy Now":** Bypasses the shopping bag entirely, opening an instant single-item checkout session without disturbing items already in the customer's cart.
- **Database-Synced Shopping Bag:** Cart items persist across devices and browser sessions in the PostgreSQL `cart_items` table.
- **Live Variant Quantity Adjustments:** Increment, decrement, or remove items with automatic recalculation of prices, discounts, taxes, and shipping fees.
- **Cart Stock Validation:** Checks inventory limits in real-time before allowing checkout progress.

---

### 2.5 Wishlist Management
- **One-Click Wishlist Toggle:** Save favorite items directly from product cards or the detail page.
- **Database Persistence:** Stores user wishlist items in `wishlist_items` tied to customer UUIDs.
- **Direct Bag Transfer:** Seamlessly move items from the wishlist directly into the active shopping cart.

---

### 2.6 Promotional Coupons & Discount Engine
- **Configurable Promotion Rules:** Evaluates percentage-based discounts and flat-rate coupon codes with minimum order limits and maximum discount caps:
  - `WELCOME10`: 10% discount on orders ₹499+ (max discount ₹150).
  - `FLAT200`: Flat ₹200 off on orders ₹1,299+.
  - `MAXFIT30`: 30% discount on orders ₹2,999+ (max discount ₹1,000).
- **Server Validation:** Discount calculations are strictly computed on the backend to prevent client-side manipulation.

---

### 2.7 Authoritative GST Billing & Checkout
- **Dual-Tier Apparel GST Calculation:** Enforces Indian statutory taxation logic:
  - Garments priced under ₹1,000 incur **5% GST**.
  - Garments priced at ₹1,000 and above incur **12% GST**.
- **Free Shipping Threshold:** Orders of ₹999 and above receive complimentary shipping; orders below ₹999 incur a flat ₹99 delivery fee.
- **Address Book Management:** Save, select, edit, and delete multiple delivery addresses with postal code formatting and default address flags.

---

### 2.8 Razorpay Payments & Atomic Stock Locking
- **Standardized Payment Flow:** Opens the official Razorpay test-mode checkout modal supporting Test Cards, NetBanking, and UPI.
- **Pessimistic Atomic Stock Lock:** Executes PostgreSQL stored function `decrement_variant_stock()` with row-level locks (`SELECT ... FOR UPDATE`) when the order is initiated, preventing duplicate checkouts of the last item in stock.
- **Cryptographic Signature Verification:** Verifies payment authenticity on the backend using timing-safe HMAC-SHA256 comparison between `razorpay_order_id`, `razorpay_payment_id`, and `RZP_KEY_SECRET`.
- **Payment Retry for Abandoned Orders:** If payment is dismissed or cancelled, the order remains in `pending` status, allowing the customer to re-open the payment gateway without re-adding items.
- **Asynchronous Webhook Listener:** Listens for `payment.captured` and `payment.failed` webhooks to guarantee synchronization even if the user closes their browser prematurely.
- **Inventory Restoration on Cancellation:** Calling `restore_variant_stock()` automatically returns stock units to inventory when an unpaid or cancelled order expires.

---

### 2.9 Order Fulfillment & 4-Stage Delivery Tracking
- **Sequential Order Numbers:** Automatically generates formatted identifiers (e.g., `ORD-2026-001005`) via database sequence.
- **4-Stage Visual Delivery Stepper:** Tracks shipment progression across four sequential milestones:
  1. **Order Placed**: Transaction verified and receipt recorded.
  2. **Ready to Ship**: Order packed in warehouse and shipping label generated.
  3. **In Transit**: Handed over to logistics carrier and out for delivery.
  4. **Delivered**: Package delivered to customer shipping address.
- **Customer Order History:** Chronological overview of all completed and pending orders with itemized breakdowns and price summaries.

---

### 2.10 Automated PDF Invoice Generation
- **Server-Side Vector Generation:** Utilizes `pdfkit` to compile branded PDF tax invoices containing company metadata, billing and shipping addresses, line items, size/color, HSN classification, and itemized GST breakdowns.
- **Secure Cloud Invoicing:** Automatically uploads generated PDFs to the private Supabase `invoices` storage bucket and issues time-limited signed download URLs for customer access.

---

### 2.11 Administrative Management Console (`/admin`)
- **Role-Based Access Control:** Restricted exclusively to users with `role = 'admin'` verified via database Row Level Security and backend JWT verification.
- **Real-Time Financial Dashboard:** Live summary cards displaying Total Revenue, Total Orders Placed, Units Sold, and Low Stock Alerts.
- **Product Management & Image Upload:**
  - Create, view, edit, and deactivate products.
  - Direct local file image uploader with clear resolution advice: **Optimal 768×1024 portrait ratio, max 5MB, JPG/PNG**.
  - Dynamic variant generator based on category: automatically offers `S–XXL` for shirts/jackets, or waist `28–38` for jeans/cargos.
  - Toggle AI Virtual Try-On eligibility per product.
- **Live Inventory & Stock Manager:**
  - Displays SKU-level stock counters for every variant.
  - One-click stock updates with visual color cues (green for healthy, amber for low stock, red for out of stock).
- **Order Management & Delivery Tracking Control:**
  - Full visibility into all customer orders, delivery addresses, and payment IDs.
  - Interactive status dropdown: allows store administrators to advance delivery from *Placed* &rarr; *Ready to Ship* &rarr; *In Transit* &rarr; *Delivered*, or mark as *Cancelled*.
  - Manual payment status override to assist customers with offline or bank reconciliation.
- **Promotional Coupon Management:** Add, activate, or deactivate promotional discount codes.

---

### 2.12 Security & Data Isolation
- **PostgreSQL Row Level Security (RLS):** Activated across all 12 database tables. Users can only read and write their own profile, addresses, cart items, wishlist items, try-on jobs, and orders.
- **Service Role Authority:** Backend microservice uses a private `service_role` key to perform administrative database operations and execute stock modifications safely.
- **Defensive API Hardening:** Enforces `helmet` HTTP security headers, CORS origin whitelisting (`CLIENT_URL`), Express rate limiters on try-on and payment endpoints, and Zod input schema validation.
- **Privacy Preservation:** Customer uploaded portrait photos are isolated to user-owned folders in private cloud storage and are not accessible by other customers.
