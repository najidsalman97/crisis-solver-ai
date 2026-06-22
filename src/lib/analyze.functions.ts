import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { AnalysisSchema } from "./analysis-schema";
import type { Analysis } from "./analysis-schema";
import { generateAnalysis } from "./ai-provider.server";

export const analyzeReviews = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({
      reviews: z.array(z.string()).min(1).max(2000),
      geminiKey: z.string().optional(),
      openaiKey: z.string().optional(),
      openrouterKey: z.string().optional(),
      provider: z.enum(["auto", "gemini", "openai", "openrouter"]).optional(),
    }).parse(input)
  )
  .handler(async ({ data }) => {
    if (!data.reviews || data.reviews.length === 0) {
      throw new Error("No reviews provided for analysis");
    }

    try {
      const analysis = await generateAnalysis(data.reviews, {
        geminiKey: data.geminiKey,
        openaiKey: data.openaiKey,
        openrouterKey: data.openrouterKey,
        provider: data.provider || "auto",
      });
      return analysis;
    } catch (error) {
      const message = error instanceof Error ? error.message : "AI analysis failed";
      throw new Error(message);
    }
  });
