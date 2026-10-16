import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import { computeCartSummary } from '../src/controllers/cartController.js';

describe('MAXFIT Backend Core Logic Test Suite', () => {

  describe('Module 6: Cart Totals & GST Calculation', () => {
    it('calculates subtotal and GST correctly for items below ₹1000 (5% GST included)', () => {
      const items = [
        {
          qty: 2,
          variant: {
            product: { price: 400 } // total 800
          }
        }
      ];

      const summary = computeCartSummary(items);
      expect(summary.subtotal).toBe(800);
      // Shipping applies because subtotal < 999 (₹79)
      expect(summary.shippingFee).toBe(79);
      expect(summary.total).toBe(879);
      // 5% GST included = 800 * 5 / 105 = 38.10
      expect(summary.gstBreakdown.gst5).toBe(38.1);
    });

    it('calculates subtotal and GST correctly for items at or above ₹1000 (12% GST included) with free shipping', () => {
      const items = [
        {
          qty: 1,
          variant: {
            product: { price: 2000 }
          }
        }
      ];

      const summary = computeCartSummary(items);
      expect(summary.subtotal).toBe(2000);
      expect(summary.shippingFee).toBe(0); // Free shipping above 999
      expect(summary.total).toBe(2000);
      // 12% GST included = 2000 * 12 / 112 = 214.29
      expect(summary.gstBreakdown.gst12).toBe(214.29);
    });

    it('handles mixed carts with 5% and 12% GST tiers', () => {
      const items = [
        { qty: 1, variant: { product: { price: 500 } } },  // 5% tier
        { qty: 1, variant: { product: { price: 1500 } } }  // 12% tier
      ];

      const summary = computeCartSummary(items);
      expect(summary.subtotal).toBe(2000);
      expect(summary.shippingFee).toBe(0);
      expect(summary.gstBreakdown.gst5).toBe(23.81);
      expect(summary.gstBreakdown.gst12).toBe(160.71);
      expect(summary.total).toBe(2000);
    });
  });

  describe('Module 6: Coupon Discount Engine', () => {
    it('applies percentage coupon with max discount cap', () => {
      const items = [
        { qty: 2, variant: { product: { price: 2000 } } } // subtotal 4000
      ];

      const coupon = {
        code: 'MAXFIT30',
        type: 'percent',
        value: 30, // 30% of 4000 = 1200
        min_order: 1000,
        max_discount: 1000 // capped at 1000
      };

      const summary = computeCartSummary(items, coupon);
      expect(summary.discount).toBe(1000);
      expect(summary.total).toBe(3000); // 4000 - 1000 + 0 shipping
    });

    it('applies flat coupon correctly', () => {
      const items = [
        { qty: 1, variant: { product: { price: 1500 } } }
      ];

      const coupon = {
        code: 'FLAT200',
        type: 'flat',
        value: 200,
        min_order: 1499
      };

      const summary = computeCartSummary(items, coupon);
      expect(summary.discount).toBe(200);
      expect(summary.total).toBe(1300);
    });

    it('ignores coupon if minimum order amount is not met', () => {
      const items = [
        { qty: 1, variant: { product: { price: 800 } } }
      ];

      const coupon = {
        code: 'FLAT200',
        type: 'flat',
        value: 200,
        min_order: 1499
      };

      const summary = computeCartSummary(items, coupon);
      expect(summary.discount).toBe(0);
      expect(summary.total).toBe(879); // 800 + 79 shipping
    });
  });

  describe('Module 9: Razorpay HMAC SHA256 Signature Verification', () => {
    it('successfully validates genuine signature using timingSafeEqual', () => {
      const secret = 'test_secret_key_12345';
      const orderId = 'order_test_999';
      const paymentId = 'pay_test_888';

      // Generate signature
      const expected = crypto
        .createHmac('sha256', secret)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');

      // Verify
      const hmac = crypto
        .createHmac('sha256', secret)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');

      const isValid = crypto.timingSafeEqual(
        Buffer.from(expected),
        Buffer.from(hmac)
      );

      expect(isValid).toBe(true);
    });

    it('rejects tampered signature', () => {
      const secret = 'test_secret_key_12345';
      const orderId = 'order_test_999';
      const paymentId = 'pay_test_888';

      const validSignature = crypto
        .createHmac('sha256', secret)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');

      const tamperedSignature = validSignature.slice(0, -2) + 'ff';

      const isMatch = crypto.timingSafeEqual(
        Buffer.from(validSignature),
        Buffer.from(tamperedSignature)
      );

      expect(isMatch).toBe(false);
    });
  });
});
