import { f as getServerFnById, i as TSS_SERVER_FUNCTION, l as createServerFn } from "./esm-pxItHuF_.mjs";
import { At as numberType, Mt as stringType, Ot as arrayType, jt as objectType, kt as enumType } from "../_libs/@ai-sdk/gateway+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/analyze.functions-Cv4o1d16.js
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var AnalysisSchema = objectType({
	executiveSummary: stringType(),
	severity: enumType([
		"Low",
		"Medium",
		"High",
		"Critical"
	]),
	severityScore: numberType().min(0).max(100),
	topIssues: arrayType(objectType({
		title: stringType(),
		description: stringType(),
		affectedCount: numberType(),
		severity: enumType([
			"Low",
			"Medium",
			"High",
			"Critical"
		]),
		rootCause: stringType(),
		recommendedFix: stringType()
	})),
	jiraTickets: arrayType(objectType({
		title: stringType(),
		priority: enumType([
			"Low",
			"Medium",
			"High",
			"Critical"
		]),
		description: stringType(),
		acceptanceCriteria: arrayType(stringType())
	})),
	customerEmail: stringType(),
	statusPageUpdate: stringType(),
	socialMediaUpdate: stringType()
});
var analyzeReviews = createServerFn({ method: "POST" }).inputValidator((input) => objectType({
	reviews: arrayType(stringType()).min(1).max(2e3),
	geminiKey: stringType().optional(),
	openaiKey: stringType().optional(),
	openrouterKey: stringType().optional(),
	provider: enumType([
		"auto",
		"gemini",
		"openai",
		"openrouter"
	]).optional()
}).parse(input)).handler(createSsrRpc("e6388d3d293d1c3a957936e0ad045131ee2a3b3e83d4c0b3cc3c45988b82654d"));
//#endregion
export { analyzeReviews as n, AnalysisSchema as t };
