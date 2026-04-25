import nodemailer from "nodemailer";

export interface GplEmailOptions {
  to: string;
  funeralHomeName: string;
  fromName?: string;
}

export function buildGplEmailBody(funeralHomeName: string): { subject: string; text: string; html: string } {
  const subject = `Request for General Price List — ${funeralHomeName}`;

  const text = `Dear ${funeralHomeName} Staff,

I am writing to request your current General Price List (GPL) as required under the FTC Funeral Rule (16 C.F.R. Part 453).

As you may know, the Funeral Rule requires funeral providers to give a printed price list to anyone who inquires in person about funeral arrangements or the prices of funeral goods or services. I am requesting this information via email on behalf of families in your area who are comparing funeral service options.

Please reply to this email with your current GPL in any format (PDF, email, or plain text is fine).

We are a nonprofit transparency platform (Eulogy) that helps grieving families compare funeral prices in their area at no cost. Your participation helps families make informed decisions during a difficult time. Published prices will be displayed on our website with full attribution to your business.

Thank you for your time and cooperation.

Best regards,
The Eulogy Team
https://eulogy.app`;

  const html = `
<div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; color: #1a1a1a; line-height: 1.7;">
  <div style="border-bottom: 2px solid #6b7280; padding-bottom: 16px; margin-bottom: 24px;">
    <h2 style="margin: 0; font-size: 20px; font-weight: 600;">Eulogy — Funeral Price Transparency</h2>
  </div>

  <p>Dear ${funeralHomeName} Staff,</p>

  <p>I am writing to request your current <strong>General Price List (GPL)</strong> as required under the
  <strong>FTC Funeral Rule</strong> (16 C.F.R. Part 453).</p>

  <p>As you may know, the Funeral Rule requires funeral providers to give a printed price list to anyone who
  inquires in person about funeral arrangements or the prices of funeral goods or services. I am requesting
  this information via email on behalf of families in your area who are comparing funeral service options.</p>

  <p>Please reply to this email with your current GPL in any format (PDF, email, or plain text is fine).</p>

  <p style="background: #f3f4f6; padding: 16px; border-left: 4px solid #6b7280; border-radius: 4px;">
    We are a nonprofit transparency platform (<strong>Eulogy</strong>) that helps grieving families compare
    funeral prices in their area at no cost. Your participation helps families make informed decisions during
    a difficult time. Published prices will be displayed on our website with full attribution to your business.
  </p>

  <p>Thank you for your time and cooperation.</p>

  <p>Best regards,<br>
  <strong>The Eulogy Team</strong><br>
  <a href="https://eulogy.app" style="color: #6b7280;">eulogy.app</a></p>
</div>`;

  return { subject, text, html };
}

export async function sendGplRequest(options: GplEmailOptions): Promise<void> {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const { subject, text, html } = buildGplEmailBody(options.funeralHomeName);

  await transporter.sendMail({
    from: `"${options.fromName || "Eulogy Team"}" <${process.env.SMTP_USER}>`,
    to: options.to,
    subject,
    text,
    html,
  });
}
