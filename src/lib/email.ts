import { Resend } from "resend";

let _resend: Resend | null = null;
function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || "Forge Fitness <onboarding@resend.dev>";
const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "Forge Fitness";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// ─── Shared email layout ───────────────────────────────────────────────────

function emailLayout(content: string): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
    <body style="margin:0;padding:0;background:#0f0f14;">
      <div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:520px;margin:0 auto;padding:40px 20px;">
        <!-- Logo -->
        <div style="text-align:center;margin-bottom:32px;">
          <h1 style="margin:0;font-size:28px;font-weight:900;letter-spacing:1px;">
            <span style="color:#FF6B00;">FORGE</span>
            <span style="color:#ffffff;"> FITNESS</span>
          </h1>
        </div>
        <!-- Card -->
        <div style="background:#1A1A2E;border-radius:12px;padding:32px;border:1px solid #27272a;">
          ${content}
        </div>
        <!-- Footer -->
        <div style="text-align:center;margin-top:24px;">
          <p style="color:#52525b;font-size:11px;margin:0;">
            &copy; ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.
          </p>
          <p style="margin:8px 0 0;">
            <a href="${APP_URL}/privacy" style="color:#52525b;font-size:11px;text-decoration:none;">Privacy</a>
            &nbsp;&middot;&nbsp;
            <a href="${APP_URL}/terms" style="color:#52525b;font-size:11px;text-decoration:none;">Terms</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function otpBlock(otp: string): string {
  return `
    <div style="background:#27272a;border-radius:8px;padding:20px;margin:24px 0;text-align:center;">
      <span style="font-size:36px;font-weight:700;letter-spacing:8px;color:#FF6B00;">${otp}</span>
    </div>
    <p style="color:#71717a;font-size:12px;margin:0;text-align:center;">
      This code expires in 10 minutes. Do not share it with anyone.
    </p>
  `;
}

function buttonBlock(label: string, url: string): string {
  return `
    <div style="text-align:center;margin:24px 0;">
      <a href="${url}" style="display:inline-block;background:#FF6B00;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:12px 32px;border-radius:8px;">
        ${label}
      </a>
    </div>
  `;
}

// ─── Helper to send emails ─────────────────────────────────────────────────

async function send(to: string, subject: string, html: string) {
  const resend = getResend();
  if (!resend) {
    console.warn("Resend API key not configured — skipping email to", to);
    return { success: false, error: "Email service not configured" };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject,
      html,
    });

    if (error) {
      console.error("Resend email error:", error);
      return { success: false, error: error.message };
    }

    console.log(`Email sent to ${to} (id: ${data?.id})`);
    return { success: true, id: data?.id };
  } catch (err: any) {
    console.error("Email send failed:", err);
    return { success: false, error: err.message };
  }
}

// ─── OTP Emails ────────────────────────────────────────────────────────────

export async function sendOTPEmail(
  to: string,
  otp: string,
  type: "verify" | "reset"
) {
  const isVerify = type === "verify";

  const subject = isVerify
    ? `${otp} — Verify your ${APP_NAME} account`
    : `${otp} — Reset your ${APP_NAME} password`;

  const heading = isVerify ? "Welcome to Forge Fitness!" : "Password Reset Request";

  const message = isVerify
    ? "Use the code below to verify your email address and activate your account."
    : "Use the code below to reset your password. If you didn't request this, you can safely ignore this email.";

  const html = emailLayout(`
    <h2 style="color:#ffffff;font-size:22px;margin:0 0 8px;text-align:center;">${heading}</h2>
    <p style="color:#a1a1aa;font-size:14px;margin:0 0 4px;text-align:center;">${message}</p>
    ${otpBlock(otp)}
  `);

  return send(to, subject, html);
}

// ─── Welcome Email (after verification) ────────────────────────────────────

export async function sendWelcomeEmail(to: string, name: string) {
  const html = emailLayout(`
    <h2 style="color:#ffffff;font-size:22px;margin:0 0 8px;text-align:center;">You're In! 🔥</h2>
    <p style="color:#a1a1aa;font-size:14px;margin:0 0 4px;text-align:center;line-height:1.6;">
      Hey ${name}, your account is verified and you're officially part of ${APP_NAME}.
      Start exploring workouts, connect with coaches, and join the community.
    </p>
    ${buttonBlock("Open Dashboard", `${APP_URL}/member/dashboard`)}
  `);

  return send(to, `Welcome to ${APP_NAME}!`, html);
}

// ─── Event Booking Confirmation ────────────────────────────────────────────

export async function sendEventBookingEmail(
  to: string,
  eventName: string,
  eventDate: string,
  eventTime: string,
  location?: string
) {
  const locationLine = location
    ? `<p style="color:#a1a1aa;font-size:14px;margin:4px 0 0;">📍 ${location}</p>`
    : "";

  const html = emailLayout(`
    <h2 style="color:#ffffff;font-size:22px;margin:0 0 8px;text-align:center;">Booking Confirmed</h2>
    <p style="color:#a1a1aa;font-size:14px;margin:0 0 20px;text-align:center;">
      You're booked for the following event:
    </p>
    <div style="background:#27272a;border-radius:8px;padding:20px;margin:0 0 20px;">
      <p style="color:#FF6B00;font-size:18px;font-weight:600;margin:0;">${eventName}</p>
      <p style="color:#a1a1aa;font-size:14px;margin:8px 0 0;">📅 ${eventDate} at ${eventTime}</p>
      ${locationLine}
    </div>
    ${buttonBlock("View My Events", `${APP_URL}/member/events`)}
  `);

  return send(to, `Booking Confirmed: ${eventName}`, html);
}

// ─── Event Reminder ────────────────────────────────────────────────────────

export async function sendEventReminderEmail(
  to: string,
  eventName: string,
  eventDate: string,
  eventTime: string
) {
  const html = emailLayout(`
    <h2 style="color:#ffffff;font-size:22px;margin:0 0 8px;text-align:center;">Reminder: Upcoming Event</h2>
    <p style="color:#a1a1aa;font-size:14px;margin:0 0 20px;text-align:center;">
      Your event is coming up soon — don't miss it!
    </p>
    <div style="background:#27272a;border-radius:8px;padding:20px;margin:0 0 20px;">
      <p style="color:#FF6B00;font-size:18px;font-weight:600;margin:0;">${eventName}</p>
      <p style="color:#a1a1aa;font-size:14px;margin:8px 0 0;">📅 ${eventDate} at ${eventTime}</p>
    </div>
    ${buttonBlock("View Event", `${APP_URL}/member/events`)}
  `);

  return send(to, `Reminder: ${eventName} is coming up!`, html);
}

// ─── Waitlist Promotion ────────────────────────────────────────────────────

export async function sendWaitlistPromotionEmail(
  to: string,
  eventName: string,
  eventDate: string,
  eventTime: string
) {
  const html = emailLayout(`
    <h2 style="color:#ffffff;font-size:22px;margin:0 0 8px;text-align:center;">A Spot Opened Up!</h2>
    <p style="color:#a1a1aa;font-size:14px;margin:0 0 20px;text-align:center;">
      Great news — a spot opened up and you've been moved off the waitlist!
    </p>
    <div style="background:#27272a;border-radius:8px;padding:20px;margin:0 0 20px;">
      <p style="color:#FF6B00;font-size:18px;font-weight:600;margin:0;">${eventName}</p>
      <p style="color:#a1a1aa;font-size:14px;margin:8px 0 0;">📅 ${eventDate} at ${eventTime}</p>
    </div>
    ${buttonBlock("View My Events", `${APP_URL}/member/events`)}
  `);

  return send(to, `You're in! Spot opened for ${eventName}`, html);
}

// ─── Coach Approval ────────────────────────────────────────────────────────

export async function sendCoachApprovalEmail(to: string, name: string, approved: boolean) {
  const heading = approved ? "You've Been Approved!" : "Application Update";
  const message = approved
    ? `Congrats ${name}! Your coach application has been approved. You can now create workouts, schedule events, and start streaming.`
    : `Hey ${name}, we've reviewed your coach application. Unfortunately, we're unable to approve it at this time. Please contact support for more info.`;

  const html = emailLayout(`
    <h2 style="color:#ffffff;font-size:22px;margin:0 0 8px;text-align:center;">${heading}</h2>
    <p style="color:#a1a1aa;font-size:14px;margin:0;text-align:center;line-height:1.6;">${message}</p>
    ${approved ? buttonBlock("Go to Coach Dashboard", `${APP_URL}/coach/dashboard`) : ""}
  `);

  return send(
    to,
    approved ? `Coach Application Approved — ${APP_NAME}` : `Coach Application Update — ${APP_NAME}`,
    html
  );
}

// ─── Order Confirmation ────────────────────────────────────────────────────

export async function sendOrderConfirmationEmail(
  to: string,
  orderId: string,
  total: string,
  itemCount: number
) {
  const html = emailLayout(`
    <h2 style="color:#ffffff;font-size:22px;margin:0 0 8px;text-align:center;">Order Confirmed</h2>
    <p style="color:#a1a1aa;font-size:14px;margin:0 0 20px;text-align:center;">
      Thanks for your purchase! Here's your order summary.
    </p>
    <div style="background:#27272a;border-radius:8px;padding:20px;margin:0 0 20px;">
      <table style="width:100%;color:#a1a1aa;font-size:14px;">
        <tr><td style="padding:4px 0;">Order ID</td><td style="text-align:right;color:#ffffff;">#${orderId.slice(0, 8).toUpperCase()}</td></tr>
        <tr><td style="padding:4px 0;">Items</td><td style="text-align:right;color:#ffffff;">${itemCount}</td></tr>
        <tr><td style="padding:8px 0 0;border-top:1px solid #3f3f46;font-weight:600;color:#ffffff;">Total</td><td style="text-align:right;padding:8px 0 0;border-top:1px solid #3f3f46;font-weight:600;color:#FF6B00;">${total}</td></tr>
      </table>
    </div>
    ${buttonBlock("View Order", `${APP_URL}/member/shop`)}
  `);

  return send(to, `Order Confirmed #${orderId.slice(0, 8).toUpperCase()}`, html);
}

// ─── Subscription Confirmation ─────────────────────────────────────────────

export async function sendSubscriptionEmail(
  to: string,
  name: string,
  planName: string,
  amount: string,
  interval: string
) {
  const html = emailLayout(`
    <h2 style="color:#ffffff;font-size:22px;margin:0 0 8px;text-align:center;">Subscription Active</h2>
    <p style="color:#a1a1aa;font-size:14px;margin:0 0 20px;text-align:center;">
      Hey ${name}, your subscription is now active!
    </p>
    <div style="background:#27272a;border-radius:8px;padding:20px;margin:0 0 20px;">
      <table style="width:100%;color:#a1a1aa;font-size:14px;">
        <tr><td style="padding:4px 0;">Plan</td><td style="text-align:right;color:#ffffff;">${planName}</td></tr>
        <tr><td style="padding:4px 0;">Amount</td><td style="text-align:right;color:#FF6B00;font-weight:600;">${amount}/${interval}</td></tr>
      </table>
    </div>
    ${buttonBlock("Manage Subscription", `${APP_URL}/member/settings`)}
  `);

  return send(to, `Subscription Active: ${planName}`, html);
}

// ─── Coach Payout Notification ─────────────────────────────────────────────

export async function sendPayoutEmail(to: string, name: string, amount: string) {
  const html = emailLayout(`
    <h2 style="color:#ffffff;font-size:22px;margin:0 0 8px;text-align:center;">Payout Sent</h2>
    <p style="color:#a1a1aa;font-size:14px;margin:0 0 20px;text-align:center;">
      Hey ${name}, your payout of <strong style="color:#FF6B00;">${amount}</strong> has been sent to your connected bank account.
    </p>
    <p style="color:#71717a;font-size:12px;margin:0;text-align:center;">
      It may take 2-5 business days to appear in your account.
    </p>
    ${buttonBlock("View Earnings", `${APP_URL}/coach/earnings`)}
  `);

  return send(to, `Payout Sent: ${amount}`, html);
}

// ─── Donation Received (Coach) ─────────────────────────────────────────────

export async function sendDonationReceivedEmail(
  to: string,
  coachName: string,
  donorName: string,
  amount: string,
  message?: string
) {
  const msgLine = message
    ? `<p style="color:#a1a1aa;font-size:13px;font-style:italic;margin:12px 0 0;">"${message}"</p>`
    : "";

  const html = emailLayout(`
    <h2 style="color:#ffffff;font-size:22px;margin:0 0 8px;text-align:center;">You Received a Donation!</h2>
    <div style="background:#27272a;border-radius:8px;padding:20px;margin:20px 0;text-align:center;">
      <p style="color:#a1a1aa;font-size:14px;margin:0;">From <strong style="color:#ffffff;">${donorName}</strong></p>
      <p style="color:#FF6B00;font-size:28px;font-weight:700;margin:8px 0 0;">${amount}</p>
      ${msgLine}
    </div>
    ${buttonBlock("View Donations", `${APP_URL}/coach/donations`)}
  `);

  return send(to, `${donorName} sent you ${amount}!`, html);
}

// ─── Live Stream Starting (Notification to followers) ──────────────────────

export async function sendStreamNotificationEmail(
  to: string,
  coachName: string,
  streamTitle: string
) {
  const html = emailLayout(`
    <h2 style="color:#ffffff;font-size:22px;margin:0 0 8px;text-align:center;">🔴 Live Now</h2>
    <p style="color:#a1a1aa;font-size:14px;margin:0 0 20px;text-align:center;">
      <strong style="color:#ffffff;">${coachName}</strong> just went live!
    </p>
    <div style="background:#27272a;border-radius:8px;padding:20px;margin:0 0 20px;text-align:center;">
      <p style="color:#FF6B00;font-size:18px;font-weight:600;margin:0;">${streamTitle}</p>
    </div>
    ${buttonBlock("Watch Now", `${APP_URL}/member/streaming`)}
  `);

  return send(to, `${coachName} is live: ${streamTitle}`, html);
}

// ─── Referral Reward ───────────────────────────────────────────────────────

export async function sendReferralRewardEmail(
  to: string,
  name: string,
  referredName: string,
  reward: string
) {
  const html = emailLayout(`
    <h2 style="color:#ffffff;font-size:22px;margin:0 0 8px;text-align:center;">Referral Reward Earned!</h2>
    <p style="color:#a1a1aa;font-size:14px;margin:0 0 20px;text-align:center;line-height:1.6;">
      Hey ${name}, <strong style="color:#ffffff;">${referredName}</strong> just joined using your referral link!
      You've earned <strong style="color:#FF6B00;">${reward}</strong>.
    </p>
    ${buttonBlock("View Referrals", `${APP_URL}/member/referrals`)}
  `);

  return send(to, `You earned ${reward} from a referral!`, html);
}

// ─── Support Request (to support team) ────────────────────────────────────

export async function sendSupportEmail(
  name: string,
  email: string,
  subject: string,
  message: string
) {
  const supportEmail = process.env.SUPPORT_EMAIL || FROM_EMAIL.replace(/<.*>/, "").trim();

  const html = emailLayout(`
    <h2 style="color:#ffffff;font-size:22px;margin:0 0 8px;text-align:center;">New Support Request</h2>
    <div style="background:#27272a;border-radius:8px;padding:20px;margin:20px 0;">
      <table style="width:100%;color:#a1a1aa;font-size:14px;">
        <tr><td style="padding:4px 0;color:#71717a;">From</td><td style="text-align:right;color:#ffffff;">${name}</td></tr>
        <tr><td style="padding:4px 0;color:#71717a;">Email</td><td style="text-align:right;color:#ffffff;">${email}</td></tr>
        <tr><td style="padding:4px 0;color:#71717a;">Subject</td><td style="text-align:right;color:#FF6B00;font-weight:600;">${subject}</td></tr>
      </table>
    </div>
    <div style="background:#27272a;border-radius:8px;padding:20px;margin:0 0 20px;">
      <p style="color:#a1a1aa;font-size:13px;font-style:italic;margin:0;line-height:1.6;">${message}</p>
    </div>
  `);

  return send(supportEmail, `Support: ${subject}`, html);
}

// ─── Support Request Confirmation (to user) ──────────────────────────────

export async function sendSupportConfirmationEmail(to: string, name: string, subject: string) {
  const html = emailLayout(`
    <h2 style="color:#ffffff;font-size:22px;margin:0 0 8px;text-align:center;">We Got Your Message</h2>
    <p style="color:#a1a1aa;font-size:14px;margin:0 0 20px;text-align:center;line-height:1.6;">
      Hey ${name}, we've received your support request regarding "<strong style="color:#ffffff;">${subject}</strong>".
      Our team will get back to you within 24-48 hours.
    </p>
    ${buttonBlock("Back to App", `${APP_URL}/member/dashboard`)}
  `);

  return send(to, `We received your support request — ${APP_NAME}`, html);
}

// ─── Account Blocked / Unblocked ───────────────────────────────────────────

export async function sendAccountStatusEmail(
  to: string,
  name: string,
  blocked: boolean
) {
  const heading = blocked ? "Account Suspended" : "Account Reinstated";
  const message = blocked
    ? `Hey ${name}, your account has been suspended due to a violation of our terms of service. If you believe this is a mistake, please contact support.`
    : `Hey ${name}, your account has been reinstated. You can now log in and use ${APP_NAME} again.`;

  const html = emailLayout(`
    <h2 style="color:#ffffff;font-size:22px;margin:0 0 8px;text-align:center;">${heading}</h2>
    <p style="color:#a1a1aa;font-size:14px;margin:0;text-align:center;line-height:1.6;">${message}</p>
    ${!blocked ? buttonBlock("Log In", `${APP_URL}/login`) : ""}
  `);

  return send(to, `${heading} — ${APP_NAME}`, html);
}
