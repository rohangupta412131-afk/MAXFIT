import PDFDocument from 'pdfkit';
import { supabaseAdmin } from '../config/supabase.js';

class InvoiceService {
  async generateInvoicePdf(order, orderItems) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const buffers = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', reject);

        // Header
        doc
          .fillColor('#111827')
          .fontSize(24)
          .font('Helvetica-Bold')
          .text('MAXFIT', 50, 45)
          .fontSize(9)
          .font('Helvetica')
          .fillColor('#6B7280')
          .text('PREMIUM D2C APPAREL & VIRTUAL TRY-ON', 50, 72)
          .text('GSTIN: 29AABCM1234F1Z8 | info@maxfit.studio', 50, 84);

        doc
          .fontSize(16)
          .font('Helvetica-Bold')
          .fillColor('#111827')
          .text('TAX INVOICE', 400, 45, { align: 'right' })
          .fontSize(9)
          .font('Helvetica')
          .fillColor('#4B5563')
          .text(`Invoice No: ${order.order_number}`, 400, 65, { align: 'right' })
          .text(`Date: ${new Date(order.created_at).toLocaleDateString('en-IN')}`, 400, 78, { align: 'right' })
          .text(`Payment ID: ${order.razorpay_payment_id || 'N/A'}`, 400, 91, { align: 'right' });

        doc.moveTo(50, 115).lineTo(545, 115).strokeColor('#E5E7EB').stroke();

        // Customer & Shipping Info
        const addr = order.shipping_address || {};
        doc
          .fontSize(10)
          .font('Helvetica-Bold')
          .fillColor('#111827')
          .text('Billed & Shipped To:', 50, 130)
          .font('Helvetica')
          .fillColor('#4B5563')
          .text(addr.name || 'Customer', 50, 145)
          .text(addr.line1 || '', 50, 158)
          .text(`${addr.city || ''}, ${addr.state || ''} - ${addr.pincode || ''}`, 50, 171)
          .text(`Phone: ${addr.phone || ''}`, 50, 184);

        // Table Header
        let y = 220;
        doc
          .rect(50, y, 495, 22)
          .fill('#F3F4F6');

        doc
          .fontSize(9)
          .font('Helvetica-Bold')
          .fillColor('#111827')
          .text('Item Description', 60, y + 6)
          .text('Size', 240, y + 6)
          .text('Color', 285, y + 6)
          .text('Qty', 345, y + 6, { align: 'center', width: 30 })
          .text('Unit Price', 385, y + 6, { align: 'right', width: 60 })
          .text('Amount (INR)', 460, y + 6, { align: 'right', width: 75 });

        // Table Items
        y += 28;
        doc.font('Helvetica').fontSize(9).fillColor('#374151');

        for (const item of orderItems) {
          const lineTotal = item.qty * Number(item.unit_price);
          doc
            .text(item.product_name, 60, y, { width: 170 })
            .text(item.size, 240, y)
            .text(item.color, 285, y)
            .text(item.qty.toString(), 345, y, { align: 'center', width: 30 })
            .text(`₹${Number(item.unit_price).toFixed(2)}`, 385, y, { align: 'right', width: 60 })
            .text(`₹${lineTotal.toFixed(2)}`, 460, y, { align: 'right', width: 75 });

          y += 22;
          doc.moveTo(50, y - 4).lineTo(545, y - 4).strokeColor('#F3F4F6').stroke();
        }

        // Summary Breakdown
        y += 15;
        const startSummaryX = 350;
        const valueX = 460;

        doc
          .font('Helvetica')
          .fontSize(9)
          .fillColor('#4B5563')
          .text('Subtotal:', startSummaryX, y)
          .text(`₹${Number(order.subtotal).toFixed(2)}`, valueX, y, { align: 'right', width: 75 });

        if (Number(order.discount) > 0) {
          y += 16;
          doc
            .text(`Discount (${order.coupon_code || 'Promo'}):`, startSummaryX, y)
            .fillColor('#059669')
            .text(`-₹${Number(order.discount).toFixed(2)}`, valueX, y, { align: 'right', width: 75 })
            .fillColor('#4B5563');
        }

        y += 16;
        doc
          .text('Shipping:', startSummaryX, y)
          .text(Number(order.shipping_fee) === 0 ? 'FREE' : `₹${Number(order.shipping_fee).toFixed(2)}`, valueX, y, { align: 'right', width: 75 });

        y += 16;
        doc
          .text('Estimated GST (Incl.):', startSummaryX, y)
          .text(`₹${Number(order.tax).toFixed(2)}`, valueX, y, { align: 'right', width: 75 });

        y += 20;
        doc.moveTo(startSummaryX, y - 4).lineTo(545, y - 4).strokeColor('#D1D5DB').stroke();

        doc
          .font('Helvetica-Bold')
          .fontSize(11)
          .fillColor('#111827')
          .text('Total Paid:', startSummaryX, y)
          .text(`₹${Number(order.total).toFixed(2)}`, valueX, y, { align: 'right', width: 75 });

        // Footer Note
        doc
          .font('Helvetica')
          .fontSize(8)
          .fillColor('#9CA3AF')
          .text('This is a computer-generated invoice and does not require a physical signature.', 50, 720, { align: 'center', width: 495 })
          .text('Thank you for shopping with MAXFIT. For returns and support, contact support@maxfit.studio', 50, 732, { align: 'center', width: 495 });

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }

  async createAndUploadInvoice(order, orderItems) {
    try {
      const pdfBuffer = await this.generateInvoicePdf(order, orderItems);
      const filePath = `${order.user_id}/${order.id}.pdf`;

      const { error: uploadError } = await supabaseAdmin.storage
        .from('invoices')
        .upload(filePath, pdfBuffer, {
          contentType: 'application/pdf',
          upsert: true
        });

      if (uploadError) {
        console.error('[InvoiceService] Upload failed:', uploadError);
        return null;
      }

      console.log(`[InvoiceService] Invoice created for order ${order.order_number}`);
      return filePath;
    } catch (err) {
      console.error('[InvoiceService] Error:', err);
      return null;
    }
  }

  async getInvoiceSignedUrl(filePath) {
    const { data, error } = await supabaseAdmin.storage
      .from('invoices')
      .createSignedUrl(filePath, 3600); // 1 hour

    if (error) throw error;
    return data.signedUrl;
  }
}

export const invoiceService = new InvoiceService();
