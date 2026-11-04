import { formatMoney } from '@oofy/shared';
import { env } from './env';

const baseStyles = `
  body { margin: 0; padding: 0; background: #111111; color: #111111; font-family: Inter, system-ui, -apple-system, sans-serif; }
  .wrapper { width: 100%; background: #111111; padding: 32px 16px; }
  .card { max-width: 640px; margin: 0 auto; background: #F5F2E9; border-radius: 16px; overflow: hidden; }
  .header { background: #111111; color: #FFFFFF; padding: 28px 24px; text-align: center; }
  .header h1 { margin: 0; font-size: 22px; text-transform: uppercase; letter-spacing: 1px; }
  .body { padding: 28px 24px; }
  .body h2 { margin-top: 0; font-size: 18px; text-transform: uppercase; color: #0B5D45; }
  table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px; }
  th { text-align: left; color: #0B5D45; padding: 10px 8px; border-bottom: 1px solid #d8d4c4; }
  td { padding: 10px 8px; border-bottom: 1px solid #d8d4c4; color: #111111; }
  .badge { display: inline-block; background: #0B5D45; color: #FFFFFF; font-size: 11px; padding: 4px 10px; border-radius: 999px; text-transform: uppercase; }
  .total { font-size: 18px; font-weight: bold; color: #111111; margin-top: 16px; text-align: right; }
  .footer { padding: 24px; font-size: 12px; color: #666254; text-align: center; border-top: 1px solid #d8d4c4; }
  .footer a { color: #0B5D45; text-decoration: none; }
  .cta { display: inline-block; background: #111111; color: #F5F2E9; text-decoration: none; padding: 12px 24px; border-radius: 8px; margin: 16px 0; font-weight: bold; }
  .note { font-size: 13px; color: #666254; background: #FFFFFF; padding: 14px; border-radius: 8px; margin: 16px 0; }
`;

export function orderAdminEmailHtml(order: any, items: any[]): string {
  const itemsHtml = items
    .map(
      (i) => `
    <tr>
      <td>${i.productName}</td>
      <td>${i.productSku ?? '-'}</td>
      <td style="text-align:center">${i.size}</td>
      <td style="text-align:center">${i.quantity}</td>
      <td style="text-align:right">${formatMoney(i.price)}</td>
    </tr>`,
    )
    .join('');

  return `
<!DOCTYPE html>
<html><body>
<div class="wrapper">
  <div class="card">
    <div class="header"><h1>New OOFY Order</h1></div>
    <div class="body">
      <h2>Order #${order.orderNumber}</h2>
      <p><strong>Customer:</strong> ${order.customerName}</p>
      <p><strong>Phone:</strong> ${order.customerPhone}</p>
      <p><strong>Email:</strong> ${order.customerEmail ?? 'Not provided'}</p>
      <p><strong>Address:</strong> ${order.address}, ${order.district}</p>
      <p><strong>Zone:</strong> ${order.zone === 'INSIDE_DHAKA' ? 'Inside Dhaka' : 'Outside Dhaka'}</p>
      <p><strong>Payment method:</strong> ${order.paymentMethod}</p>
      <p><strong>Payment status:</strong> ${order.paymentStatus}</p>
      <p><strong>Order note:</strong> ${order.orderNote ?? '—'}</p>

      <table>
        <thead><tr><th>Product</th><th>SKU</th><th>Size</th><th>Qty</th><th>Price</th></tr></thead>
        <tbody>${itemsHtml}</tbody>
      </table>

      <div class="total">
        Subtotal: ${formatMoney(order.subtotal)}<br />
        Delivery: ${formatMoney(order.deliveryCharge)}<br />
        Grand total: ${formatMoney(order.totalAmount)}
      </div>

      <p><strong>Order date:</strong> ${new Date(order.createdAt).toLocaleString('en-BD', { timeZone: 'Asia/Dhaka' })}</p>
      <a href="${env.FRONTEND_URL}/track-order?token=${order.trackingToken}" class="cta">View Order Tracking</a>
    </div>
    <div class="footer">
      OOFY &bull; ${env.COMPANY_ADDRESS} &bull; <a href="mailto:${env.COMPANY_EMAIL}">${env.COMPANY_EMAIL}</a>
    </div>
  </div>
</div>
</body></html>`;
}

export function orderCustomerEmailHtml(order: any, items: any[]): string {
  const itemsHtml = items
    .map(
      (i) => `
    <tr>
      <td>${i.productName}</td>
      <td style="text-align:center">${i.size}</td>
      <td style="text-align:center">${i.quantity}</td>
      <td style="text-align:right">${formatMoney(i.price)}</td>
    </tr>`,
    )
    .join('');

  return `
<!DOCTYPE html>
<html><body>
<div class="wrapper">
  <div class="card">
    <div class="header"><h1>Thank You, ${order.customerName}</h1></div>
    <div class="body">
      <h2>Your OOFY order is confirmed</h2>
      <p>
        We&rsquo;ve received your order <strong>#${order.orderNumber}</strong>. Wear your confidence &mdash; we&rsquo;re getting it ready for you.
      </p>

      <table>
        <thead><tr><th>Product</th><th>Size</th><th>Qty</th><th>Price</th></tr></thead>
        <tbody>${itemsHtml}</tbody>
      </table>

      <div class="total">
        Subtotal: ${formatMoney(order.subtotal)}<br />
        Delivery: ${formatMoney(order.deliveryCharge)}<br />
        Grand total: ${formatMoney(order.totalAmount)}
      </div>

      <p><strong>Payment method:</strong> ${order.paymentMethod}</p>
      <p><strong>Delivery to:</strong> ${order.address}, ${order.district} (${order.zone === 'INSIDE_DHAKA' ? 'Inside Dhaka' : 'Outside Dhaka'})</p>
      <p><strong>Order note:</strong> ${order.orderNote ?? '—'}</p>

      <div class="note">
        You can track your order anytime at:
        <br /><strong>${env.FRONTEND_URL}/track-order?token=${order.trackingToken}</strong>
      </div>

      <p>
        Questions? Reply to this email or contact us at
        <strong>${env.COMPANY_EMAIL}</strong> / ${env.COMPANY_PHONE}.
      </p>
    </div>
    <div class="footer">
      OOFY &mdash; Wear Your Confidence &bull; ${env.COMPANY_ADDRESS}
    </div>
  </div>
</div>
</body></html>`;
}

export function contactEmailHtml(message: any): string {
  return `
<!DOCTYPE html>
<html><body>
<div class="wrapper">
  <div class="card">
    <div class="header"><h1>New Contact Message</h1></div>
    <div class="body">
      <p><strong>Name:</strong> ${message.name}</p>
      <p><strong>Email:</strong> ${message.email}</p>
      <p><strong>Message:</strong></p>
      <div class="note">${message.message.replace(/\n/g, '<br />')}</div>
    </div>
    <div class="footer">
      OOFY &bull; ${env.COMPANY_ADDRESS}
    </div>
  </div>
</div>
</body></html>`;
}
