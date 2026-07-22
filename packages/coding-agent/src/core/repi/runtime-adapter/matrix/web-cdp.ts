/** Runtime adapter matrix: web CDP network adapter. */

import { webCdpNetworkFallbackCommandTemplate } from "../command-templates.ts";
import type { RuntimeAdapterExecutionSpec } from "../types.ts";
import { WEB_CDP_SCRIPT_HELPER_LINES } from "./web-cdp-script-helpers.ts";
import { WEB_CDP_SCRIPT_MAIN_LINES } from "./web-cdp-script-main.ts";

/** Runtime adapter matrix: web. */
export const RUNTIME_ADAPTER_WEB_CDP_SPEC: RuntimeAdapterExecutionSpec = {
	id: "web-cdp-network-adapter",
	bridgeId: "web-cdp-replay",
	domainId: "web-api",
	tool: "node",
	fallbackTool: "curl",
	runnerKind: "cdp-capture",
	commandTemplate: [...WEB_CDP_SCRIPT_HELPER_LINES, ...WEB_CDP_SCRIPT_MAIN_LINES].join("\n"),
	fallbackCommandTemplate: webCdpNetworkFallbackCommandTemplate(),
	parserRules: [
		{
			id: "parser-cdp-network-event",
			regex: "(Network\\.|requestWillBeSent|responseReceived|\\[http-response\\]|\\[web-cdp-version\\]|\\[cdp-target-list\\]|HTTP/[0-9.]+|status=[0-9]{3})",
			evidenceRank: "network",
			proofExitSignal: "HTTP/CDP response capture",
		},
		{
			id: "parser-xhr-ws-route",
			regex: "(\\[web-route-map\\]|\\[route-candidate\\]|fetch|XMLHttpRequest|WebSocket|xhr|graphql|/api/|wss?://)",
			evidenceRank: "network",
			proofExitSignal: "XHR/WS route extraction",
		},
		{
			id: "parser-request-order-capture",
			regex: "(\\[request-order\\]|\\[web-request-body\\]|route_index=|request[_ -]?order)",
			evidenceRank: "served_asset",
			proofExitSignal: "request order proof",
		},
		{
			id: "parser-signed-replay-diff",
			regex: "(\\[web-signed-field\\]|\\[web-header-signal\\]|\\[web-cookie-signal\\]|signature|\\bsign\\b|nonce|timestamp|x-[a-z0-9-]*sign|authorization|csrf)",
			evidenceRank: "network",
			proofExitSignal: "signed request replay",
		},
	],
	artifactKinds: [
		"cdp-network-har",
		"xhr-ws-route-map",
		"request-order-map",
		"signed-replay-diff",
		"web-header-cookie-signals",
		"web-request-body-hashes",
		"cdp-target-version",
		"runtime-adapter-transcript",
	],
	ingestTargets: ["evidence-ledger", "knowledge-graph"],
	envRefs: ["REPI_BROWSER_CDP_URL", "REPI_BROWSER_PROFILE_DIR", "REPI_RUNTIME_ADAPTER_TIMEOUT_MS"],
	proofExitSignals: [
		"HTTP/CDP response capture",
		"XHR/WS route extraction",
		"signed request replay",
		"request order proof",
		"proof.exit=partial_runtime_capture",
		"proof.exit=runtime_capture_strong",
		"bind_ready=true",
	],
};
