import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_placeholder", {
  apiVersion: "2025-02-24.acacia",
  typescript: true,
});

// ─── Subscription plan config ─────────────────────────────────────────────

export const PLANS = {
  BASIC: {
    name: "Basic",
    monthlyPrice: 999, // cents
    yearlyPrice: 9990,
    features: [
      "Access to workout library",
      "Community access",
      "Event booking",
      "Basic analytics",
    ],
  },
  PREMIUM: {
    name: "Premium",
    monthlyPrice: 1999,
    yearlyPrice: 19990,
    features: [
      "Everything in Basic",
      "Live streaming access",
      "1:1 coach messaging",
      "Music library",
      "Advanced analytics",
    ],
  },
  ELITE: {
    name: "Elite",
    monthlyPrice: 3999,
    yearlyPrice: 39990,
    features: [
      "Everything in Premium",
      "Priority event booking",
      "Personal training sessions",
      "Exclusive content",
      "Wearable integration",
    ],
  },
} as const;

export type PlanKey = keyof typeof PLANS;

// ─── Helpers ──────────────────────────────────────────────────────────────

export async function getOrCreateCustomer(
  email: string,
  name: string,
  userId: string
): Promise<string> {
  // Search for existing customer by metadata
  const existing = await stripe.customers.list({
    email,
    limit: 1,
  });

  if (existing.data.length > 0) {
    return existing.data[0].id;
  }

  const customer = await stripe.customers.create({
    email,
    name,
    metadata: { userId },
  });

  return customer.id;
}

export function formatAmountForDisplay(amount: number): string {
  return `$${(amount / 100).toFixed(2)}`;
}
