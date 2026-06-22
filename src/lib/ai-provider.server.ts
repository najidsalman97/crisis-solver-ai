import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { z } from "zod";
import { Analysis, AnalysisSchema } from "./analyze.functions";

export type AIProvider = "gemini" | "openai" | "openrouter" | "auto";

export interface AIConfig {
  provider: AIProvider;
  geminiKey?: string;
  openaiKey?: string;
  openrouterKey?: string;
}

/**
 * Receive API configuration directly from client
 */
export function getApiConfig(config: AIConfig): AIConfig {
  return config;
}

/**
 * Get the appropriate AI model based on available keys
 */
export function selectAIModel(config: AIConfig) {
  const { provider, geminiKey, openaiKey, openrouterKey } = config;

  if (provider === "gemini" || (provider === "auto" && geminiKey)) {
    if (!geminiKey) throw new Error("Gemini API key not provided");
    return google("gemini-2.0-flash", { apiKey: geminiKey });
  }

  if (provider === "openai" || (provider === "auto" && !geminiKey && openaiKey)) {
    if (!openaiKey) throw new Error("OpenAI API key not provided");
    return openai("gpt-4o-mini", { apiKey: openaiKey });
  }

  if (provider === "openrouter" || (provider === "auto" && !geminiKey && !openaiKey && openrouterKey)) {
    if (!openrouterKey) throw new Error("OpenRouter API key not provided");
    return createOpenAICompatible({
      name: "openrouter",
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: openrouterKey,
    })("gpt-4o-mini");
  }

  // No API keys available
  throw new Error("No AI provider configured. Please set API keys in Settings.");
}

/**
 * System prompt for crisis analysis
 */
const CRISIS_ANALYSIS_SYSTEM_PROMPT = `You are an expert crisis management analyst. Analyze customer reviews and feedback to identify:
1. Critical issues affecting customers
2. Root causes of problems
3. Severity levels
4. Recommended fixes
5. Necessary customer communications
6. Jira ticket requirements

Respond with a detailed JSON analysis matching the exact schema provided. Be precise, actionable, and data-driven.`;

/**
 * Generate analysis using AI
 */
export async function generateAnalysis(
  reviews: string[],
  config: AIConfig
): Promise<Analysis> {
  const model = selectAIModel(config);

  const reviewsText = reviews.join("\n---\n");

  const { object } = await generateObject({
    model,
    system: CRISIS_ANALYSIS_SYSTEM_PROMPT,
    prompt: `Analyze these ${reviews.length} customer reviews:\n\n${reviewsText}`,
    schema: AnalysisSchema,
  });

  return object as Analysis;
}
