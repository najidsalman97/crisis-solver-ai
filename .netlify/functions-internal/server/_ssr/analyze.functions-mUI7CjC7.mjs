import { i as TSS_SERVER_FUNCTION, l as createServerFn } from "./esm-zB9EGFGL.mjs";
import { Mt as stringType, Ot as arrayType, jt as objectType } from "../_libs/@ai-sdk/gateway+[...].mjs";
import { t as AnalysisSchema } from "./analyze.functions-C6FZidrO.mjs";
import { t as openai } from "../_libs/ai-sdk__openai+zod.mjs";
import { t as generateObject } from "../_libs/ai.mjs";
import { t as google } from "../_libs/ai-sdk__google.mjs";
import { t as createOpenAICompatible } from "../_libs/ai-sdk__openai-compatible.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/analyze.functions-mUI7CjC7.js
var createServerRpc = (serverFnMeta, splitImportFn) => {
	const url = "/_serverFn/" + serverFnMeta.id;
	return Object.assign(splitImportFn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
/**
* Load API keys from request headers or environment
*/
function getApiKeysFromRequest(request) {
	const geminiKey = request.headers.get("x-gemini-key");
	const openaiKey = request.headers.get("x-openai-key");
	const openrouterKey = request.headers.get("x-openrouter-key");
	return {
		provider: request.headers.get("x-ai-provider") || "auto",
		geminiKey: geminiKey || void 0,
		openaiKey: openaiKey || void 0,
		openrouterKey: openrouterKey || void 0
	};
}
/**
* Get the appropriate AI model based on available keys
*/
function selectAIModel(config) {
	const { provider, geminiKey, openaiKey, openrouterKey } = config;
	if (provider === "gemini" || provider === "auto" && geminiKey) {
		if (!geminiKey) throw new Error("Gemini API key not provided");
		return google("gemini-2.0-flash", { apiKey: geminiKey });
	}
	if (provider === "openai" || provider === "auto" && !geminiKey && openaiKey) {
		if (!openaiKey) throw new Error("OpenAI API key not provided");
		return openai("gpt-4o-mini", { apiKey: openaiKey });
	}
	if (provider === "openrouter" || provider === "auto" && !geminiKey && !openaiKey && openrouterKey) {
		if (!openrouterKey) throw new Error("OpenRouter API key not provided");
		return createOpenAICompatible({
			name: "openrouter",
			baseURL: "https://openrouter.ai/api/v1",
			apiKey: openrouterKey
		})("gpt-4o-mini");
	}
	throw new Error("No AI provider configured. Please set API keys in Settings.");
}
/**
* System prompt for crisis analysis
*/
var CRISIS_ANALYSIS_SYSTEM_PROMPT = `You are an expert crisis management analyst. Analyze customer reviews and feedback to identify:
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
async function generateAnalysis(reviews, request) {
	const model = selectAIModel(getApiKeysFromRequest(request));
	const reviewsText = reviews.join("\n---\n");
	const { object } = await generateObject({
		model,
		system: CRISIS_ANALYSIS_SYSTEM_PROMPT,
		prompt: `Analyze these ${reviews.length} customer reviews:\n\n${reviewsText}`,
		schema: AnalysisSchema
	});
	return object;
}
var analyzeReviews_createServerFn_handler = createServerRpc({
	id: "e6388d3d293d1c3a957936e0ad045131ee2a3b3e83d4c0b3cc3c45988b82654d",
	name: "analyzeReviews",
	filename: "src/lib/analyze.functions.ts"
}, (opts) => analyzeReviews.__executeServer(opts));
var analyzeReviews = createServerFn({ method: "POST" }).inputValidator((input) => objectType({ reviews: arrayType(stringType()).min(1).max(2e3) }).parse(input)).handler(analyzeReviews_createServerFn_handler, async ({ data }, req) => {
	if (!data.reviews || data.reviews.length === 0) throw new Error("No reviews provided for analysis");
	try {
		return await generateAnalysis(data.reviews, req);
	} catch (error) {
		const message = error instanceof Error ? error.message : "AI analysis failed";
		throw new Error(message);
	}
});
//#endregion
export { analyzeReviews_createServerFn_handler };
