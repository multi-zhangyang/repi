/** Live browser probe matrix strings. */
export function liveBrowserProbeMatrices(url: string | undefined): {
	authMatrix: string[];
	idorBolaProbes: string[];
	websocketProbes: string[];
} {
	return {
		authMatrix: [
			"capture anonymous baseline: cookies/localStorage/sessionStorage + request/response status",
			"capture authenticated baseline with supplied browser profile or cookie jar when available",
			"diff anonymous vs authenticated routes, status codes, redirects, object ids, CSRF/JWT/session fields",
			"negative control: replay authenticated object request without credential or with second identity",
		],
		idorBolaProbes: [
			url
				? `replace numeric/id/uuid path or query tokens in ${url} and replay with same cookies`
				: "replace object id in <URL> and replay",
			"compare status/body length/cache headers before and after object id mutation",
			"record ownership proof: object id, actor/session, expected deny/allow, response hash",
		],
		websocketProbes: [
			"record [browser-websocket] endpoints and inbound/outbound frame heads",
			"replay connection with same origin/cookie headers and mutate object/channel identifiers",
			"bind each frame to state transition or authz decision before claiming impact",
		],
	};
}
