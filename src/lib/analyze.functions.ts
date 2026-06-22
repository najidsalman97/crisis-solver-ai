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
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const gateway = createLovableAiGatewayProvider(key);

    const sample = data.reviews.slice(0, 300).join("\n---\n");

    const prompt = `You are CrisisRoom AI, a senior product crisis analyst. Analyze the following ${data.reviews.length} customer reviews/tickets and produce a complete crisis response report.

REVIEWS:
${sample}

Produce:
- A sharp executive summary (3-5 sentences) suitable for a CEO.
- Overall severity (Low/Medium/High/Critical) and a severityScore 0-100.
- topIssues: 3-6 most critical issues, each with root cause and recommended fix. Estimate affectedCount from frequency in the sample.
- jiraTickets: One ticket per top issue, with clear acceptance criteria.
- customerEmail: A warm, transparent email to affected customers acknowledging issues and next steps.
- statusPageUpdate: A concise status page incident update.
- socialMediaUpdate: A short (<280 chars) public social post.

Be specific, executive-grade, and actionable.`;

    const { experimental_output } = await generateText({
      model: gateway("google/gemini-3-flash-preview"),
      experimental_output: Output.object({ schema: AnalysisSchema }),
      prompt,
    });

    return experimental_output;
  });
