# MAXFIT | Full-Stack D2C Clothing E-Commerce with AI Virtual Try-On

A complete, production-grade direct-to-consumer (D2C) fashion platform featuring an integrated **AI Virtual Try-On** pipeline powered by **IDM-VTON** neural diffusion, real-time Razorpay test payments, server-computed GST billing & PDF invoices, biometric size recommendation, and a comprehensive admin console.

---

## 🏛 Architecture Diagram

```mermaid
graph TD
    User([Customer / Client Browser])
    Admin([Store Administrator])

    subgraph Frontend [React 19 + Tailwind CSS v4 + Vite]
        UI[Storefront & Studio UI]
        AuthContext[Auth Context]
        CartContext[Cart Context]
        Slider[Before / After Slider]
        RzpCheckout[Razorpay Checkout SDK]
    end

    subgraph Backend [Node.js + Express ES Modules]
        API[Express REST API /api/v1]
        AuthMid[Auth & Admin Guard Middleware]
        RateLimiter[Rate Limiters]
        VTONService[VTON Service @gradio/client]
        InvoiceService[Invoice Service pdfkit]
        PaymentCtrl[Payment & HMAC Signature Controller]
    end

    subgraph CloudServices [Supabase & External AI APIs]
        SupabaseDB[(PostgreSQL + RLS)]
        SupabaseStorage[(Private & Public Storage Buckets)]
        HF[Hugging Face Space: yisol/IDM-VTON]
        RazorpayGateway[Razorpay Payment Gateway API]
    end

    User --> UI
    Admin --> UI
    UI --> API
    UI --> RzpCheckout
    UI --> SupabaseStorage

    API --> AuthMid
    API --> RateLimiter
    API --> SupabaseDB
    API --> PaymentCtrl
    API --> VTONService
    API --> InvoiceService

    VTONService -->|Gradio WS/REST| HF
    PaymentCtrl -->|HMAC Verify / Refund| RazorpayGateway
    InvoiceService -->|Store PDF| SupabaseStorage
```

---

## ✨ Core Features

1. **AI Virtual Try-On Studio (IDM-VTON)**
   - Upload any front-facing portrait (client-side compressed to 768x1024).
   - Select any try-on enabled garment from the catalogue.
   - Diffusion neural network maps the garment with auto-masking and realistic fabric drape synthesis.
   - Interactive **Before/After Split Comparison Slider**.
   - One-click "Add this fit to Bag" and High-Resolution Download.
   - "My Saved Fits" gallery with storage management and permanent deletion.

2. **Biometric Size Recommender Engine**
   - Calculates ideal sizing (XS through XXL) using height, weight, optional chest/waist measurements, and fit preference (Slim, Regular, Relaxed).
   - Real-time variant stock check for the recommended size.
   - Saves biometrics to customer profile for instant future checkout.

3. **Storefront & Catalog**
   - Fast catalogue search and multi-facet filtering (categories, gender, size, price, in-stock only).
   - Responsive product cards with image hover swap and quick try-on shortcuts.
   - Interactive size guide modal with category measurements in centimeters.

4. **Bag & Dynamic Pricing Engine**
   - Server-side authoritative price computation (client prices never trusted).
   - Dual-tier GST calculation (5% apparel GST under ₹1,000; 12% at or above ₹1,000).
   - Promo coupon engine (`WELCOME10`, `FLAT200`, `MAXFIT30`) with minimum order and max discount caps.
   - Free shipping rules (orders ₹999 and above).

5. **Razorpay Payments & Atomic Inventory Control**
   - Razorpay test mode integration with order generation and dynamic checkout loading.
   - Timing-safe HMAC SHA256 signature verification.
   - **Atomic Stock Decrement** via PostgreSQL function `decrement_variant_stock` (prevents race conditions and overselling).
   - Idempotent payment webhook listener (`payment.captured`, `payment.failed`).

6. **Automated GST PDF Invoices**
   - Vector-rendered tax invoices generated on successful payment via `pdfkit`.
   - Stored in encrypted private Supabase storage and served via signed download URLs.

7. **Comprehensive Admin Console (`/admin`)**
   - Revenue, orders, pending checkouts, and low-stock alerts (< 5 units).
   - Try-on analytics (total runs and success rate).
   - Products CRUD, variant manager, orders status updater, and coupon manager.

---

## 🛠 Tech Stack

- **Frontend**: React 19, Vite 6, Tailwind CSS v4 (`@tailwindcss/vite` with `@theme` design tokens), React Router 7, `@supabase/supabase-js`, `lucide-react`, `react-hot-toast`, `canvas-confetti`.
- **Backend**: Node.js 25, Express (ES modules), `@gradio/client`, `zod`, `helmet`, `cors`, `express-rate-limit`, `morgan`, `sharp`, `pdfkit`, `pg`, `razorpay`.
- **Database & Storage**: Supabase (PostgreSQL with Row Level Security, RPC functions, and private Storage buckets).
- **AI Infrastructure**: Hugging Face Space (`yisol/IDM-VTON`) via `@gradio/client`.

---

## 🚀 Quick Start & Run Instructions

### 1. Install All Dependencies
From the repository root:
```bash
npm run install:all
```

### 2. Configure Environment Variables
Create `.env` in `/server` and `/client`:

**`/server/.env`**:
```env
PORT=5000
CLIENT_URL=http://localhost:5173
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_DB_PASSWORD=your_supabase_db_password
DATABASE_URL=postgresql://postgres.your-project:password@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
RZP_KEY_ID=your_razorpay_key_id
RZP_KEY_SECRET=your_razorpay_key_secret
RZP_WEBHOOK_SECRET=your_razorpay_webhook_secret
HF_TOKEN=your_huggingface_token
HF_SPACE=yisol/IDM-VTON
```

**`/client/.env`**:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=http://localhost:5000/api/v1
VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
```

### 3. Run Database Migrations & Seed Data
```bash
# Run schema migrations (tables, RLS policies, functions, storage buckets)
npm --prefix server run migrate

# Seed 21 products, 71 variants, size charts, and 3 coupons
npm run seed
```

### 4. Run Both Server and Client Concurrently
```bash
npm run dev
```
- Client runs at: `http://localhost:5173`
- Backend API runs at: `http://localhost:5000/api/v1`
- Health check: `http://localhost:5000/health`

---

## 🧪 Testing

Run backend Vitest test suite:
```bash
npm test
```
Tests cover:
- Cart subtotal and dual-tier GST calculations
- Coupon discount validation and caps
- Razorpay HMAC SHA256 timing-safe signature verification
- Stock decrements and safety checks

---

## 📋 API Endpoints Reference

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| GET | `/api/v1/health` | Service health status | No |
| GET | `/api/v1/products` | Filterable product catalogue with pagination | No |
| GET | `/api/v1/products/:slug` | Single product details & related items | No |
| GET | `/api/v1/categories` | Categories listing | No |
| POST | `/api/v1/auth/profile` | Read/update user fit profile | Bearer Token |
| GET/POST | `/api/v1/auth/addresses` | Customer address book CRUD | Bearer Token |
| GET/POST/PATCH/DELETE | `/api/v1/cart` | Cart bag management with server-computed summary | Bearer Token |
| POST | `/api/v1/cart/apply-coupon`| Validate and apply promo code | Bearer Token |
| GET/POST/DELETE | `/api/v1/wishlist` | Saved wishlist items | Bearer Token |
| POST | `/api/v1/payments/create-order`| Create Razorpay & DB pending order | Bearer Token |
| POST | `/api/v1/payments/verify` | Verify HMAC payment signature and capture order | Bearer Token |
| POST | `/api/v1/payments/webhook`| Idempotent Razorpay webhook listener | Webhook Sig |
| GET | `/api/v1/orders` | Customer order history | Bearer Token |
| GET | `/api/v1/orders/:id/invoice`| Download PDF invoice signed URL | Bearer Token |
| POST | `/api/v1/orders/:id/cancel`| Cancel order and initiate refund | Bearer Token |
| POST | `/api/v1/tryon` | Queue AI Virtual Try-On job | Bearer Token |
| GET | `/api/v1/tryon/:id` | Status & signed URLs for generated try-on | Bearer Token |
| GET | `/api/v1/tryon` | User's try-on generation history | Bearer Token |
| POST | `/api/v1/size/recommend`| AI biometric sizing recommendation | Optional |
| GET | `/api/v1/admin/metrics` | Dashboard revenue & analytics | Admin Only |
| GET/POST/PUT/DELETE | `/api/v1/admin/products`| Admin inventory catalogue management | Admin Only |
| GET/PATCH | `/api/v1/admin/orders` | Admin order management & status updater | Admin Only |
| GET/POST/DELETE | `/api/v1/admin/coupons`| Admin coupon management | Admin Only |

---

## ⚠️ Known Limitations & Disclaimers

1. **IDM-VTON Licensing**: IDM-VTON is released under the **CC BY-NC-SA 4.0** license for academic and non-commercial research purposes.
2. **Inference Latency**: Diffusion inference on cloud GPU takes approximately 20 to 45 seconds depending on Hugging Face Space queue depth.
3. **Photo Compatibility**: Works best with clear, front-facing standing portraits with arms uncrossed from torso and even lighting. Tops, shirts, t-shirts, and hoodies yield the highest fidelity.
