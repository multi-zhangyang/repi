/** Browser runtime/XHR/WS/CDP/IDOR signal collection. */
import { interestingLines, truncateMiddle, uniqueMatches } from "../../../text.ts";

export function collectBrowserRuntimeSignals(
	combined: string,
	findings: string[],
): {
	runtimeLines: string[];
	websocketAnchors: string[];
	storageAnchors: string[];
	cdpLines: string[];
	artifactAnchors: string[];
	replayLines: string[];
	routeGraphLines: string[];
	authMatrixLines: string[];
	idorProbeLines: string[];
} {
	const runtimeLines = interestingLines(
		combined,
		/\[request\]|\[response\]|\[websocket\]|\[cookies\]|\[localStorage\]|\[sessionStorage\]|\[cdp-request\]|\[cdp-response\]|\[cdp-ws\]|\[browser-artifact\]|\[storage-snapshot\]|\[replay-eval\]|set-cookie|authorization|bearer|csrf|jwt|status:/i,
		20,
	);
	if (runtimeLines.length > 0) {
		findings.push(
			`browser/XHR/WS runtime anchors: ${runtimeLines.map((line: any) => truncateMiddle(line, 180)).join(" | ")}`,
		);
	}
	const websocketAnchors = uniqueMatches(combined, /\[websocket\]\s+(\S+)/gi, 8);
	if (websocketAnchors.length > 0) findings.push(`websocket endpoint anchors: ${websocketAnchors.join(", ")}`);
	const storageAnchors = interestingLines(
		combined,
		/\[cookies\]|\[localStorage\]|\[sessionStorage\]|access_token|refresh_token|session|jwt/i,
		8,
	);
	if (storageAnchors.length > 0) {
		findings.push(
			`cookie/storage anchors: ${storageAnchors.map((line: any) => truncateMiddle(line, 180)).join(" | ")}`,
		);
	}
	const cdpLines = interestingLines(
		combined,
		/\[cdp-request\]|\[cdp-response\]|\[cdp-ws\]|\[browser-artifact\]|\[storage-snapshot\]/i,
		18,
	);
	if (cdpLines.length > 0) {
		findings.push(
			`browser CDP artifact anchors: ${cdpLines.map((line: any) => truncateMiddle(line, 180)).join(" | ")}`,
		);
	}
	const artifactAnchors = uniqueMatches(combined, /\[browser-artifact\]\s+(\S+)/gi, 6);
	if (artifactAnchors.length > 0) findings.push(`browser runtime artifact paths: ${artifactAnchors.join(", ")}`);
	const replayLines = interestingLines(combined, /\[replay-eval\]/i, 10);
	if (replayLines.length > 0) {
		findings.push(
			`browser replay evaluator anchors: ${replayLines.map((line: any) => truncateMiddle(line, 200)).join(" | ")}`,
		);
	}
	const routeGraphLines = interestingLines(combined, /\[route-graph\]|\[route-node\]/i, 18);
	if (routeGraphLines.length > 0) {
		findings.push(
			`browser route graph anchors: ${routeGraphLines.map((line: any) => truncateMiddle(line, 200)).join(" | ")}`,
		);
	}
	const authMatrixLines = interestingLines(combined, /\[auth-matrix\]/i, 14);
	if (authMatrixLines.length > 0) {
		findings.push(
			`browser auth matrix anchors: ${authMatrixLines.map((line: any) => truncateMiddle(line, 200)).join(" | ")}`,
		);
	}
	const idorProbeLines = interestingLines(combined, /\[idor-candidate\]|\[idor-probe\]|IDOR|BOLA/i, 16);
	if (idorProbeLines.length > 0) {
		findings.push(
			`browser IDOR/BOLA probe anchors: ${idorProbeLines.map((line: any) => truncateMiddle(line, 200)).join(" | ")}`,
		);
	}
	return {
		runtimeLines,
		websocketAnchors,
		storageAnchors,
		cdpLines,
		artifactAnchors,
		replayLines,
		routeGraphLines,
		authMatrixLines,
		idorProbeLines,
	};
}
