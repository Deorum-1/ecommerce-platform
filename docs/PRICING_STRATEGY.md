# Pricing Strategy

**Multi-Tenant E-Commerce SaaS Platform**  
Target Market: Nigeria  
Last Updated: 24 November 2026

---

## 1. Purpose of This Document

This document defines the pricing model for the platform. It is based on:

- Competitor analysis (Shopify, Bumpa, Vendda, CartMor, Jumia, Paystack/Flutterwave Store)
- Local market realities in Nigeria (Naira pricing, SME purchasing power, preference for simplicity)
- The platform’s positioning: *the easiest multi-store e-commerce platform for Nigerian businesses — especially those who already manage products in Excel*

The goal is a simple, transparent, and sustainable pricing structure that supports early growth while remaining competitive.

---

## 2. Competitor Pricing Summary

### Global Benchmark – Shopify (USD)

| Plan       | Monthly (billed monthly) | Monthly (billed yearly) | Notes |
|------------|---------------------------|--------------------------|-------|
| Basic      | $39                       | $29                      | Solo / small stores |
| Grow       | $105                      | $79                      | Small teams |
| Advanced   | $399                      | $299                     | Higher volume |
| Plus       | From $2,300               | Contract                 | Enterprise |

Additional costs: card processing fees + possible 0.2–2% platform fee when using third-party gateways such as Paystack.

**Relevance**: Too expensive and USD-denominated for most Nigerian SMEs.

### Local Nigerian Platforms

| Platform   | Model                      | Starting Price                  | Higher Plans                     | Platform Transaction Fee |
|------------|----------------------------|---------------------------------|----------------------------------|--------------------------|
| Bumpa      | Subscription (Naira)       | ₦5,000/mo (Starter)             | Pro ₦10,000 · Growth ~₦21,000+  | None                     |
| Vendda     | Subscription (Naira)       | ₦4,000/mo (Starter)             | Standard ₦7,500 · Superb ₦18,000| None                     |
| CartMor    | Subscription (Naira)       | ~₦4,200/mo (yearly)             | Higher tiers                     | 0%                       |
| Jumia      | Marketplace commission     | Free to join                    | —                                | 7–22% + shipping fees    |
| Paystack / Flutterwave Store | Free + gateway fees | Free                          | —                                | Gateway fees only        |

**Key insights**:
- Local platforms price in **Naira**.
- Entry plans typically sit between **₦4,000 – ₦10,000 per month**.
- Most pure SaaS tools do **not** take a percentage of sales.
- Marketplace model (Jumia) takes a high commission instead of a subscription.

---

## 3. Strategic Pricing Principles

1. **Price in Naira** — Avoid USD billing friction and exchange-rate risk for customers.
2. **Simple & transparent** — Clear monthly/yearly prices. No hidden platform fees on sales at launch.
3. **Value-based tiers** — Higher plans unlock more products, staff, SMS credits, analytics, and custom domains.
4. **Sustainable for a solo builder** — Pricing must cover infrastructure, SMS, support, and future development.
5. **Competitive but not race-to-the-bottom** — Position slightly above pure entry-level tools because of stronger bulk-upload, multi-tenancy, and SMS capabilities.
6. **Free trial first** — Make it easy to start. Convert on experience, not just price.

---

## 4. Recommended Pricing Model

### Billing
- Primary: Monthly subscription in Naira
- Strong incentive for yearly billing (15–20% discount)
- Payment via Paystack (card + bank transfer)

### Free Trial
- 14 days free trial on all plans
- Full access during trial
- No credit card required to start trial (optional)

### Platform Fees on Sales
- **0% platform fee** at launch
- Customers only pay standard Paystack (or future crypto) fees
- This keeps the offer clean and competitive

---

## 5. Proposed Plan Tiers

| Plan          | Monthly Price     | Yearly Price (approx.) | Target Customer                          | Key Limits & Features |
|---------------|-------------------|------------------------|------------------------------------------|-----------------------|
| **Starter**   | ₦9,500            | ₦95,000 (≈ 2 months free) | Small shops testing the platform        | Up to 150 products<br>1 staff account<br>Basic analytics<br>Limited SMS credits<br>Subdomain only |
| **Growth**    | ₦22,000           | ₦220,000               | Serious single-store companies          | Up to 1,000 products<br>5 staff accounts<br>Full bulk CSV/Excel upload<br>Standard SMS credits<br>Custom domain support<br>Better analytics |
| **Business**  | ₦39,000           | ₦390,000               | Growing teams / higher volume           | Unlimited products*<br>15 staff accounts<br>Priority SMS<br>Advanced analytics<br>Multiple locations (future)<br>Priority support |
| **Enterprise**| Custom            | Custom                 | Larger companies or multi-brand needs   | White-label options<br>SLA<br>Dedicated support<br>Custom limits<br>Possible API access |

\* Reasonable fair-use limits may still apply on Business plan.

### Feature Differentiation (High Level)

| Feature                        | Starter     | Growth      | Business    | Enterprise |
|--------------------------------|-------------|-------------|-------------|------------|
| Products                       | 150         | 1,000       | Unlimited*  | Custom     |
| Staff accounts                 | 1           | 5           | 15          | Custom     |
| Bulk CSV / Excel upload        | Basic       | Full        | Full        | Full       |
| Custom domain                  | —           | Yes         | Yes         | Yes        |
| SMS notifications              | Limited     | Standard    | Priority    | Custom     |
| Analytics                      | Basic       | Standard    | Advanced    | Advanced + |
| Multi-currency                 | Yes         | Yes         | Yes         | Yes        |
| Discounts / Coupons            | Yes         | Yes         | Yes         | Yes        |
| Priority support               | —           | —           | Yes         | Dedicated  |

Exact limits will be refined during development and can be adjusted based on early customer feedback.

---

## 6. Rationale for the Price Points

- **Starter (₦9,500)**: Sits comfortably above pure entry tools (Bumpa/Vendda ~₦4–5k) while remaining accessible. Positions the platform as more capable (better bulk upload + multi-tenant foundation).
- **Growth (₦22,000)**: The core plan. Designed to be the “sweet spot” for most serious Nigerian shopping companies. Strong value for the features offered.
- **Business (₦39,000)**: For companies that need more staff, higher volume, and better support. Still significantly cheaper than Shopify Advanced.
- **Yearly discount**: Encourages longer commitment and improves cash flow predictability.

These prices leave healthy margin after covering:
- Hosting (Vercel + Railway / Neon + Upstash)
- SMS costs
- Support time
- Future development

---

## 7. Implementation Notes

1. **Billing system**: Use Paystack Subscriptions or a simple custom subscription engine with Paystack.
2. **Plan enforcement**: Soft limits first (warnings), hard limits later if needed.
3. **Upgrades / Downgrades**: Allow mid-cycle changes. Prorate where reasonable.
4. **SMS credits**: Either include a monthly allowance per plan or sell credit packs. Prefer inclusion for simplicity at launch.
5. **Custom domains**: Available from Growth plan upward. Clear setup instructions required.
6. **Early customers**: Consider special founder pricing or extended trials for the first 5–10 companies to gather feedback and testimonials.

---

## 8. Future Considerations

- Usage-based add-ons (extra SMS packs, extra staff seats, extra product slots)
- Possible small platform fee on very high-volume plans (only if needed for sustainability)
- White-label / reseller options under Enterprise
- Regional expansion pricing (other African countries) later
- Annual price reviews based on cost changes and market feedback

---

## 9. Success Metrics to Watch

- Trial → paid conversion rate
- Plan distribution (how many choose Growth vs Starter)
- Churn rate by plan
- Willingness to pay (feedback during sales conversations)
- Average revenue per tenant

---

**Status**: Draft for review  
**Next action**: Lock final numbers and feature limits before building the billing module.

*This document should be reviewed after the first 3–5 paying customers.*
