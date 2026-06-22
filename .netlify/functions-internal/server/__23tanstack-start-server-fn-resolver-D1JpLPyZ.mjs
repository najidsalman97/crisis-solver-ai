//#region node_modules/.nitro/vite/services/ssr/assets/__23tanstack-start-server-fn-resolver-D1JpLPyZ.js
var manifest = { "e6388d3d293d1c3a957936e0ad045131ee2a3b3e83d4c0b3cc3c45988b82654d": {
	functionName: "analyzeReviews_createServerFn_handler",
	importer: () => import("./_ssr/analyze.functions-pA9DKVMh.mjs")
} };
async function getServerFnById(id, access) {
	const serverFnInfo = manifest[id];
	if (!serverFnInfo) throw new Error("Server function info not found for " + id);
	const fnModule = serverFnInfo.module ?? await serverFnInfo.importer();
	if (!fnModule) throw new Error("Server function module not resolved for " + id);
	const action = fnModule[serverFnInfo.functionName];
	if (!action) throw new Error("Server function module export not resolved for serverFn ID: " + id);
	return action;
}
//#endregion
export { getServerFnById as t };
