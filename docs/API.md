# REST API Specification

The MAX-FIT REST API is built on Express (ES modules) mounted under base path `/api/v1`. All endpoints follow consistent RESTful conventions, utilizing JSON payloads and standard HTTP status codes.

---

## 1. Global Standards & Conventions

### 1.1 Base URL
- Local Development: `http://localhost:5000/api/v1`
- Service Health Check: `http://localhost:5000/health`

### 1.2 Authentication Header
Protected endpoints require a Supabase JWT bearer token:
```http
Authorization: Bearer <supabase_access_token>
```

### 1.3 Standard Response Format

#### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

#### Error Response
```json
{
  "success": false,
  "error": "Descriptive error message",
  "details": [ ... ]
}
```

---

## 2. API Endpoints Reference

### 2.1 System & Health

#### `GET /health`
Returns runtime health status.
- **Auth**: None
- **Response `200 OK`**:
```json
{
  "status": "healthy",
  "timestamp": "2026-10-18T12:00:00.000Z",
  "uptime": 124.5
}
```

---

### 2.2 Men's Product Catalog & Categories

#### `GET /api/v1/categories`
Lists all 7 men's clothing categories.
- **Auth**: None
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": [
    {
      "id": "f5347d17-b671-460e-aa28-90224ec99e06",
      "name": "Cargo",
      "slug": "cargo",
      "size_type": "bottom",
      "sort_order": 1
    },
    {
      "id": "1f745498-6bc4-4eff-9ec2-910154061518",
      "name": "Casual Shirts",
      "slug": "casual-shirts",
      "size_type": "top",
      "sort_order": 2
    }
  ]
}
```

#### `GET /api/v1/products`
Retrieves a paginated list of catalog products with multi-facet filters.
- **Auth**: None
- **Query Parameters**:
  - `page` (integer, default: `1`)
  - `limit` (integer, default: `12`)
  - `category` (string, category slug e.g. `hoodies-sweatshirt`)
  - `size` (string, e.g. `M` or `32`)
  - `min_price` (numeric)
  - `max_price` (numeric)
  - `in_stock` (boolean, `true` / `false`)
  - `sort` (string: `newest`, `price_asc`, `price_desc`)
  - `search` (string, query matching title or description)
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": [
    {
      "id": "3b29d44a-1011-4889-b132-7c34db0aa25e",
      "name": "Vintage Wash Heavyweight Denim Jacket",
      "slug": "vintage-wash-heavyweight-denim-jacket",
      "price": 1049.00,
      "mrp": 1899.00,
      "category": { "name": "Men's Jacket", "slug": "mens-jacket" },
      "images": ["https://.../jacket-front.jpg"],
      "garment_image": "https://.../jacket-front.jpg",
      "tryon_enabled": true,
      "total_stock": 42
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 12,
    "total": 62,
    "totalPages": 6
  }
}
```

#### `GET /api/v1/products/:slug`
Fetches complete product details, variants, stock status, and related items.
- **Auth**: None
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "id": "3b29d44a-1011-4889-b132-7c34db0aa25e",
    "name": "Vintage Wash Heavyweight Denim Jacket",
    "slug": "vintage-wash-heavyweight-denim-jacket",
    "description": "Engineered with drop shoulder cut, heavy ribbed collar, and pre-shrunk wash.",
    "price": 1049.00,
    "mrp": 1899.00,
    "fabric": "100% Cotton Denim, 14.5 oz",
    "care_instructions": "Machine wash cold inside out, hang dry.",
    "tryon_enabled": true,
    "variants": [
      { "id": "uuid-1", "size": "S", "color": "Vintage Blue", "stock": 10 },
      { "id": "uuid-2", "size": "M", "color": "Vintage Blue", "stock": 14 }
    ],
    "related": [ ... ]
  }
}
```

---

### 2.3 Authentication, Profile & Address Book

#### `GET /api/v1/auth/profile`
Retrieves customer fit profile and biometric measurements.
- **Auth**: Bearer Token
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "id": "user-uuid",
    "full_name": "Rohan Gupta",
    "phone": "+919876543210",
    "role": "customer",
    "height_cm": 178.0,
    "weight_kg": 74.0
  }
}
```

#### `PUT /api/v1/auth/profile`
Updates profile details and biometric sizing measurements.
- **Auth**: Bearer Token
- **Request Body**:
```json
{
  "full_name": "Rohan Gupta",
  "phone": "+919876543210",
  "height_cm": 180.0,
  "weight_kg": 76.5
}
```

#### `GET /api/v1/auth/addresses`
Lists all saved delivery addresses.
- **Auth**: Bearer Token

#### `POST /api/v1/auth/addresses`
Creates a new shipping address.
- **Auth**: Bearer Token
- **Request Body**:
```json
{
  "name": "Rohan Gupta",
  "phone": "9876543210",
  "line1": "Flat 402, Skyline Residency",
  "line2": "MG Road, Indiranagar",
  "city": "Bengaluru",
  "state": "Karnataka",
  "pincode": "560038",
  "is_default": true
}
```

---

### 2.4 Shopping Bag & Direct Buy Now

#### `GET /api/v1/cart`
Retrieves bag items and server-computed pricing summary.
- **Auth**: Bearer Token
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "cart-item-uuid",
        "qty": 2,
        "variant": {
          "id": "variant-uuid",
          "size": "L",
          "color": "Navy",
          "stock": 12,
          "product": {
            "name": "Navy White Oxford Buffalo Check Shirt",
            "price": 849.00
          }
        }
      }
    ],
    "summary": {
      "subtotal": 1698.00,
      "discount": 0.00,
      "shippingFee": 0.00,
      "gstBreakdown": {
        "gst5": 80.86,
        "gst12": 0.00,
        "totalTax": 80.86
      },
      "total": 1698.00,
      "couponApplied": null
    }
  }
}
```

#### `GET /api/v1/cart/buy-now-preview`
Calculates instant pricing for a single item direct checkout path.
- **Auth**: Bearer Token
- **Query Parameters**:
  - `variantId` (UUID, required)
  - `qty` (integer, default: `1`)
  - `couponCode` (string, optional)
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "item": {
      "qty": 1,
      "variant": {
        "id": "variant-uuid",
        "size": "32",
        "stock": 8,
        "product": {
          "name": "Charcoal Slate Tactical Heavyweight Cargo",
          "price": 949.00
        }
      }
    },
    "summary": {
      "subtotal": 949.00,
      "discount": 0.00,
      "shippingFee": 79.00,
      "gstBreakdown": {
        "gst5": 45.19,
        "gst12": 0.00,
        "totalTax": 45.19
      },
      "total": 1028.00
    }
  }
}
```

#### `POST /api/v1/cart`
Adds an item to the shopping bag.
- **Auth**: Bearer Token
- **Request Body**:
```json
{
  "variant_id": "variant-uuid",
  "qty": 1
}
```

#### `POST /api/v1/cart/apply-coupon`
Validates and applies promotional discount code.
- **Auth**: Bearer Token
- **Request Body**:
```json
{
  "code": "WELCOME10"
}
```

---

### 2.5 Razorpay Payments & Order Fulfillment

#### `POST /api/v1/payments/create-order`
Creates a database pending order and Razorpay order.
- **Auth**: Bearer Token
- **Request Body**:
```json
{
  "addressId": "address-uuid",
  "couponCode": "FLAT200",
  "buyNowVariantId": null,
  "buyNowQty": 1
}
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "orderId": "order-uuid",
    "orderNumber": "ORD-2026-001004",
    "razorpayOrderId": "order_NxY98AbCdefG12",
    "amount": 149900,
    "keyId": "rzp_test_YourKeyId"
  }
}
```

#### `POST /api/v1/payments/verify`
Verifies Razorpay HMAC SHA256 signature and atomically decrements variant stock.
- **Auth**: Bearer Token
- **Request Body**:
```json
{
  "orderId": "order-uuid",
  "razorpay_order_id": "order_NxY98AbCdefG12",
  "razorpay_payment_id": "pay_NxZ87Xyz123456",
  "razorpay_signature": "4a7b98f...hex_signature"
}
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "orderId": "order-uuid",
    "orderNumber": "ORD-2026-001004"
  },
  "message": "Payment verified and order captured successfully"
}
```

#### `POST /api/v1/payments/retry/:orderId`
Re-initializes a Razorpay order for an existing pending order.
- **Auth**: Bearer Token
- **Response `200 OK`**: Returns new `razorpayOrderId`, `amount`, and `keyId`.

#### `GET /api/v1/orders`
Retrieves historical customer orders.
- **Auth**: Bearer Token

#### `GET /api/v1/orders/:id`
Retrieves detailed order record with 4-stage delivery tracking status (`pending`, `paid`, `processing`, `shipped`, `delivered`, `cancelled`).
- **Auth**: Bearer Token

#### `GET /api/v1/orders/:id/invoice`
Returns a secure signed URL to download the vector PDF tax invoice.
- **Auth**: Bearer Token
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "signedUrl": "https://...supabase.co/storage/v1/object/sign/invoices/...token=..."
  }
}
```

#### `POST /api/v1/orders/:id/cancel`
Cancels an order and automatically calls `restore_variant_stock` to restore inventory.
- **Auth**: Bearer Token

---

### 2.6 AI Virtual Try-On Studio (IDM-VTON)

#### `POST /api/v1/tryon`
Dispatches an asynchronous Virtual Try-On job.
- **Auth**: Bearer Token
- **Content-Type**: `multipart/form-data`
- **Fields**:
  - `user_image`: Binary image file (portrait)
  - `garment_id`: UUID of selected garment
- **Response `202 Accepted`**:
```json
{
  "success": true,
  "data": {
    "jobId": "tryon-job-uuid",
    "status": "queued"
  }
}
```

#### `GET /api/v1/tryon/:id`
Polls the execution status of an active try-on job.
- **Auth**: Bearer Token
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "id": "tryon-job-uuid",
    "status": "completed",
    "progress": 100,
    "user_image_url": "https://...signed_input.jpg",
    "result_url": "https://...signed_output.jpg"
  }
}
```

#### `GET /api/v1/tryon`
Retrieves the authenticated user's saved fits gallery.
- **Auth**: Bearer Token

#### `DELETE /api/v1/tryon/:id`
Permanently deletes a saved fit job and removes the associated images from private storage.
- **Auth**: Bearer Token

---

### 2.7 Biometric Sizing Engine

#### `POST /api/v1/size/recommend`
Calculates ideal sizing based on physical metrics and fit style.
- **Auth**: Optional
- **Request Body**:
```json
{
  "category_id": "category-uuid",
  "height_cm": 178,
  "weight_kg": 74,
  "chest_cm": 100,
  "waist_cm": 82,
  "fit_preference": "regular"
}
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "recommended_size": "M",
    "confidence": 0.92,
    "explanation": "Based on your 178 cm height, 74 kg weight, and Regular fit preference, size M provides optimal chest and shoulder comfort."
  }
}
```

---

### 2.8 Administration Console (`/api/v1/admin`)
*All administrative endpoints require an authenticated user with `role = 'admin'`.*

#### `GET /api/v1/admin/metrics`
Aggregates sales revenue, order volumes, low-stock alerts, and try-on success rates.

#### `POST /api/v1/admin/upload-image`
Uploads a garment image directly from the administrator's computer to the Supabase Storage `products` bucket.
- **Content-Type**: `multipart/form-data`
- **Field**: `image` (JPEG / PNG / WEBP, max 10MB)
- **Response `200 OK`**:
```json
{
  "success": true,
  "url": "https://.../storage/v1/object/public/products/catalog/1776510000-xyz.jpg",
  "data": {
    "url": "https://.../storage/v1/object/public/products/catalog/1776510000-xyz.jpg",
    "fileName": "catalog/1776510000-xyz.jpg"
  },
  "message": "Garment image uploaded successfully"
}
```

#### `POST /api/v1/admin/products`
Creates a new garment along with its variants and stock units.

#### `PUT /api/v1/admin/products/:id`
Updates garment specifications, pricing, and variant stock.

#### `DELETE /api/v1/admin/products/:id`
Deletes a product and its child variants from the catalog.

#### `PATCH /api/v1/admin/variants/:id/stock`
Directly updates the inventory count of an individual SKU.
- **Request Body**: `{ "stock": 25 }`

#### `GET /api/v1/admin/orders`
Retrieves customer orders with optional `?status=` filtering.

#### `PATCH /api/v1/admin/orders/:id/status`
Updates order fulfillment and delivery tracking status (`processing`, `shipped`, `delivered`, `cancelled`).
- **Request Body**: `{ "status": "shipped" }`

#### `POST /api/v1/admin/coupons`
Creates a promotional coupon code.
- **Request Body**:
```json
{
  "code": "SUMMER20",
  "type": "percent",
  "value": 20,
  "min_order": 999,
  "max_discount": 400
}
```

#### `DELETE /api/v1/admin/coupons/:id`
Permanently deactivates and removes a promotional coupon.
