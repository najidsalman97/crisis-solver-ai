import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateAnalysis } from "./ai-provider.server";

export const AnalysisSchema = z.object({
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
  .handler(async ({ data }, req) => {
    if (!data.reviews || data.reviews.length === 0) {
      throw new Error("No reviews provided for analysis");
    }

    try {
      const analysis = await generateAnalysis(data.reviews, req);
      return analysis;
    } catch (error) {
      const message = error instanceof Error ? error.message : "AI analysis failed";
      throw new Error(message);
    }
  });
