import { t as getServerFnById } from "../__23tanstack-start-server-fn-resolver-KQUe4oGu.mjs";
import { c as createServerFn, i as TSS_SERVER_FUNCTION } from "./createServerFn-CIHAFgYl.mjs";
import { t as queryOptions } from "../_libs/react+tanstack__react-query.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-iy6R01v4.js
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
var getChannel = createServerFn({ method: "GET" }).handler(createSsrRpc("f39248655e18cb34b4cd6ec7c5678e6e025ad779e1b0b7cf3817c40541bb0754"));
var channelQueryOptions = queryOptions({
	queryKey: ["yt-channel"],
	queryFn: () => getChannel(),
	staleTime: 3e4,
	refetchInterval: 3e4
});
//#endregion
export { channelQueryOptions as t };
