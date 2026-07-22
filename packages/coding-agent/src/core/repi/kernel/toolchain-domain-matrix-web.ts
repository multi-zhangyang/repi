/** Toolchain domain matrix: web/frontend. */
import type { ToolchainDomainSpec } from "./toolchain-domain-types.ts";

export const TOOLCHAIN_DOMAIN_MATRIX_WEB: readonly ToolchainDomainSpec[] = [
	{
		id: "web-api",
		label: "Web/API auth, route, IDOR/BOLA, XHR/WS",
		requiredAny: ["curl", "python3", "node"],
		preferred: ["httpx", "ffuf", "nuclei", "katana", "jq", "playwright", "mitmproxy"],
		fallbacks: ["curl", "python3", "node", "rg"],
		playbookMarkers: ["route", "auth/session", "IDOR/BOLA", "JS signing", "XHR/WS"],
		commandScaffolds: ["re_live_browser", "re_web_authz_state", "re_map", "re_lane", "re_operator"],
		proofExit: ["principal matrix", "object ownership", "state rollback", "signed replay divergence"],
	},
	{
		id: "web-scan",
		label: "Web pentest scanning: scope, crawl, templates, manual replay",
		requiredAny: ["curl", "python3"],
		preferred: ["httpx", "katana", "ffuf", "feroxbuster", "gobuster", "nuclei", "nikto", "dalfox", "sqlmap"],
		fallbacks: ["curl", "python3", "node", "rg"],
		playbookMarkers: ["web scanner scope", "web scanner crawl", "web scanner template", "web scanner manual replay"],
		commandScaffolds: ["re_lane", "re_replayer", "re_verifier", "re_proof_loop"],
		proofExit: ["scope baseline", "crawl corpus", "scanner finding queue", "manual replay verifier"],
	},
	{
		id: "frontend-js",
		label: "Frontend bundle, signer rebuild, anti-bot divergence",
		requiredAny: ["node", "curl", "rg"],
		preferred: ["playwright", "jq", "mitmproxy", "python3"],
		fallbacks: ["node", "curl", "rg", "python3"],
		playbookMarkers: ["fetch/XMLHttpRequest", "WebSocket", "crypto.subtle", "first-divergence", "signed replay"],
		commandScaffolds: ["re_live_browser", "re_lane", "re_replayer", "re_proof_loop"],
		proofExit: ["observed normalizer", "first divergence", "signed replay harness"],
	},
];
