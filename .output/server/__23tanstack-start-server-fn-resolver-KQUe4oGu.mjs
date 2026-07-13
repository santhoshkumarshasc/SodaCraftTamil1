//#region node_modules/.nitro/vite/services/ssr/assets/__23tanstack-start-server-fn-resolver-KQUe4oGu.js
var manifest = { "f39248655e18cb34b4cd6ec7c5678e6e025ad779e1b0b7cf3817c40541bb0754": {
	functionName: "getChannel_createServerFn_handler",
	importer: () => import("./_ssr/youtube.functions-DJFUpjOd.mjs")
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
