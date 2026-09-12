import { logger } from "./logger";

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

type OrderEmailItem = {
  productName: string;
  quantity: number;
  unitPrice: string;
};

type OrderEmailData = {
  id: number;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  shippingAddress?: string | null;
  totalAmount: string;
  status: string;
  items: OrderEmailItem[];
};

/**
 * Low-level send via Brevo's HTTP API. Uses plain HTTPS (port 443) rather
 * than SMTP (port 587/465), which are often blocked by ISPs/routers.
 */
async function sendEmail(to: string, subject: string, htmlContent: string): Promise<boolean> {
  const apiKey = process.env["BREVO_API_KEY"];
  const senderEmail = process.env["BREVO_SENDER_EMAIL"];

  if (!apiKey || !senderEmail) {
    logger.warn(
      { to },
      "Brevo not configured (BREVO_API_KEY/BREVO_SENDER_EMAIL missing) — skipping email. Set them in artifacts/api-server/.env."
    );
    return false;
  }

  try {
    const res = await fetch(BREVO_API_URL, {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify({
        sender: { name: "Gold Hub", email: senderEmail },
        to: [{ email: to }],
        subject,
        htmlContent,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      logger.error({ status: res.status, body, to }, "Brevo rejected the email");
      return false;
    }

    return true;
  } catch (err) {
    logger.error({ err, to }, "Failed to reach Brevo to send email");
    return false;
  }
}

export async function sendVerificationEmail(to: string, code: string): Promise<boolean> {
  return sendEmail(
    to,
    "Your Gold Hub verification code",
    `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color:#1a1a1a;">Welcome to Gold Hub</h2>
        <p>Enter this code on the site to verify your email address:</p>
        <p style="margin: 24px 0; text-align: center;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #caa356;">
            ${code}
          </span>
        </p>
        <p style="color:#666;font-size:12px;">This code expires in 15 minutes.</p>
      </div>
    `
  );
}

function renderItemsTable(items: OrderEmailItem[]): string {
  const rows = items
    .map(
      (item) => `
        <tr>
          <td style="padding:8px;border-bottom:1px solid #eee;">${item.productName}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">${item.quantity}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">$${item.unitPrice}</td>
        </tr>
      `
    )
    .join("");

  return `
    <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px;">
      <thead>
        <tr style="background:#f5f5f5;">
          <th style="padding:8px;text-align:left;">Item</th>
          <th style="padding:8px;text-align:center;">Qty</th>
          <th style="padding:8px;text-align:right;">Price</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

/**
 * Notifies the given admin email addresses that a new order came in.
 * Sent once per order to every admin with an email on file.
 */
export async function sendAdminOrderNotification(
  adminEmails: string[],
  order: OrderEmailData
): Promise<void> {
  if (adminEmails.length === 0) {
    logger.warn({ orderId: order.id }, "No admin emails on file — skipping new-order notification");
    return;
  }

  const html = `
    <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
      <h2 style="color:#1a1a1a;">New Order #${order.id}</h2>
      <p><strong>Customer:</strong> ${order.customerName}</p>
      <p><strong>Email:</strong> ${order.customerEmail}</p>
      ${order.customerPhone ? `<p><strong>Phone:</strong> ${order.customerPhone}</p>` : ""}
      ${order.shippingAddress ? `<p><strong>Address:</strong> ${order.shippingAddress}</p>` : ""}
      ${renderItemsTable(order.items)}
      <p style="font-size:18px;"><strong>Total: $${order.totalAmount}</strong></p>
      <p style="color:#666;font-size:12px;">Payment method: Cash on Delivery</p>
    </div>
  `;

  for (const email of adminEmails) {
    await sendEmail(email, `New Order #${order.id} — Gold Hub`, html);
  }
}

/**
 * Sent to the customer once the admin marks their order "confirmed".
 */
export async function sendOrderConfirmationEmail(order: OrderEmailData): Promise<boolean> {
  const html = `
    <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
      <h2 style="color:#1a1a1a;">Your Gold Hub order is confirmed</h2>
      <p>Hi ${order.customerName}, your order #${order.id} has been confirmed and is being prepared.</p>
      ${renderItemsTable(order.items)}
      <p style="font-size:18px;"><strong>Total: $${order.totalAmount}</strong></p>
      <p style="color:#666;font-size:12px;">Payment method: Cash on Delivery. Thank you for shopping with Gold Hub.</p>
    </div>
  `;

  return sendEmail(order.customerEmail, `Order #${order.id} Confirmed — Gold Hub`, html);
}