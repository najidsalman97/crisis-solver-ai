import { createServerFn } from "@tanstack/react-start";
import { generateText, Output } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

const AnalysisSchema = z.object({
  executiveSummary: z.string(),
  severity: z.enum(["Low", "Medium", "High", "Critical"]),
  severityScore: z.number().min(0).max(100),
  topIssues: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      affectedCount: z.number(),
      severity: z.enum(["Low", "Medium", "High", "Critical"]),
      rootCause: z.string(),
      recommendedFix: z.string(),
    })
  ),
  jiraTickets: z.array(
    z.object({
      title: z.string(),
      priority: z.enum(["Low", "Medium", "High", "Critical"]),
      description: z.string(),
      acceptanceCriteria: z.array(z.string()),
    })
  ),
  customerEmail: z.string(),
  statusPageUpdate: z.string(),
  socialMediaUpdate: z.string(),
});

export type Analysis = z.infer<typeof AnalysisSchema>;

export const analyzeReviews = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ reviews: z.array(z.string()).min(1).max(2000) }).parse(input)
  )
  .handler(async ({ data }): Promise<Analysis> => {
    // TEMP: Bypass AI call, return hardcoded sample matching schema
    const total = data.reviews.length;
    return {
      executiveSummary:
        "A surge of customer complaints indicates a critical degradation in checkout reliability and mobile app stability over the past 48 hours. Approximately 62% of recent reviews cite failed payments, app crashes on launch, or unresponsive support. Immediate engineering and communications response is required to prevent churn and reputational damage. A coordinated hotfix, transparent customer messaging, and a public status update are recommended within the next 4 hours.",
      severity: "High",
      severityScore: 82,
      topIssues: [
        {
          title: "Checkout payment failures",
          description: "Customers report payments being declined or charged twice during checkout, particularly on credit card transactions.",
          affectedCount: Math.max(1, Math.round(total * 0.35)),
          severity: "Critical",
          rootCause: "Recent payment gateway SDK upgrade introduced a regression in the retry logic, causing duplicate authorization requests.",
          recommendedFix: "Roll back payment SDK to previous stable version and add idempotency keys to all charge requests.",
        },
        {
          title: "Mobile app crashes on launch (iOS 17)",
          description: "Users on iOS 17 devices experience immediate crashes when opening the app after the latest update.",
          affectedCount: Math.max(1, Math.round(total * 0.22)),
          severity: "High",
          rootCause: "Unhandled nil response from analytics SDK during cold start on iOS 17.",
          recommendedFix: "Ship hotfix wrapping analytics init in a guarded try/catch and lazy-load on first interaction.",
        },
        {
          title: "Support response times exceeding 72 hours",
          description: "Multiple customers complain about unanswered support tickets and lack of communication.",
          affectedCount: Math.max(1, Math.round(total * 0.18)),
          severity: "Medium",
          rootCause: "Ticket routing rule misconfiguration sending Tier 1 tickets to an inactive queue.",
          recommendedFix: "Reassign queue ownership, enable auto-acknowledgement, and surface SLA breach alerts to on-call.",
        },
        {
          title: "Order confirmation emails not delivered",
          description: "Customers complete purchases but never receive confirmation emails, causing duplicate orders and confusion.",
          affectedCount: Math.max(1, Math.round(total * 0.12)),
          severity: "High",
          rootCause: "Transactional email provider domain reputation dropped; messages routed to spam or bounced.",
          recommendedFix: "Warm up secondary sending domain, re-authenticate DKIM/SPF, and re-send last 24h of missing confirmations.",
        },
      ],
      jiraTickets: [
        {
          title: "[P0] Roll back payment SDK and add idempotency keys",
          priority: "Critical",
          description: "Customers are being double-charged due to payment SDK retry regression. Roll back to v4.2.1 and add idempotency keys.",
          acceptanceCriteria: [
            "Payment SDK reverted to v4.2.1 in production",
            "All charge requests include unique idempotency keys",
            "Zero duplicate charges observed for 24h post-deploy",
            "Refunds issued to all customers double-charged in past 72h",
          ],
        },
        {
          title: "[P1] Hotfix iOS 17 cold-start crash from analytics SDK",
          priority: "High",
          description: "App crashes on launch on iOS 17 due to unhandled analytics init failure.",
          acceptanceCriteria: [
            "Analytics init wrapped in guarded try/catch",
            "Analytics lazy-loaded after first user interaction",
            "Crash-free sessions on iOS 17 >= 99.5%",
            "Hotfix submitted to App Store with expedited review",
          ],
        },
        {
          title: "[P2] Fix support ticket routing and enable SLA alerts",
          priority: "Medium",
          description: "Tier 1 tickets are routed to an inactive queue, leading to 72h+ response delays.",
          acceptanceCriteria: [
            "Routing rule corrected to active Tier 1 queue",
            "Auto-acknowledgement email sent within 1 minute",
            "On-call paged on SLA breach > 4h",
            "Backlog cleared within 24h",
          ],
        },
        {
          title: "[P1] Restore transactional email deliverability",
          priority: "High",
          description: "Order confirmation emails are bouncing or going to spam.",
          acceptanceCriteria: [
            "Secondary sending domain warmed and active",
            "DKIM/SPF/DMARC validated",
            "Missing confirmations from past 24h re-sent",
            "Deliverability above 98% for 48h post-fix",
          ],
        },
      ],
      customerEmail:
        "Subject: We hear you — and we're fixing it\n\nHi there,\n\nOver the past two days, some of you have experienced payment errors, app crashes, or delayed responses from our support team. That's not the experience we want you to have, and we're sorry.\n\nHere's what we're doing right now:\n• Rolling back a recent payment update that caused duplicate charges — affected customers will be refunded automatically within 48 hours.\n• Shipping a hotfix for the iOS 17 crash today.\n• Clearing our support backlog and bringing in additional team members.\n\nIf you were charged twice or are still waiting on a reply, just reply to this email and we'll prioritize your case personally.\n\nThank you for your patience and for holding us to a higher standard.\n\n— The Team",
      statusPageUpdate:
        "Investigating — Elevated payment failures and iOS 17 app crashes\n\nWe are aware of issues affecting checkout payments (duplicate charges) and mobile app stability on iOS 17. Engineering is actively rolling back the payment SDK and preparing a hotfix for the iOS crash. Support response times are also elevated. Next update in 30 minutes.",
      socialMediaUpdate:
        "We're aware some of you are seeing payment errors and iOS app crashes. Our team is rolling out fixes right now, and any duplicate charges will be refunded automatically. Thanks for your patience — updates on our status page. 💙",
    };
  });
