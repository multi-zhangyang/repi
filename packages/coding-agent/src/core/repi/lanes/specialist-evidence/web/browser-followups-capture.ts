/** Browser capture/CDP/replay followups. */
import { shellQuote } from "../../../target.ts";
import { pythonString } from "../helpers.ts";
import type { LaneCommand } from "../types.ts";
import type { BrowserEvidenceSignals } from "./browser-signals.ts";

export function pushBrowserCaptureFollowups(
	followups: LaneCommand[],
	signals: Pick<BrowserEvidenceSignals, "artifactAnchors" | "websocketAnchors">,
	targetArg: string,
	packTarget?: string,
): void {
	if (packTarget && /^https?:\/\//i.test(packTarget)) {
		followups.push({
			label: "browser-xhr-ws-auth-diff-rerun",
			command: `[ -x /tmp/repi-auth-diff.sh ] && /tmp/repi-auth-diff.sh ${targetArg} "\${COOKIE_A:-}" "\${COOKIE_B:-}" || printf '%s\n' 'set COOKIE_A/COOKIE_B and rerun auth-diff scaffold for two principals'`,
			evidence: "repeat browser/XHR/WS auth boundary diff with concrete principal cookies",
		});
		followups.push({
			label: "browser-xhr-ws-capture-rerun",
			command: `[ -f /tmp/repi-browser-xhr-ws.mjs ] && node /tmp/repi-browser-xhr-ws.mjs ${targetArg} || printf '%s\n' 'rerun re_lane plan to regenerate Playwright capture scaffold'`,
			evidence: "repeat browser runtime capture after route/auth hypotheses are narrowed",
		});
		followups.push({
			label: "browser-cdp-artifact-rerun",
			command: `[ -f /tmp/repi-browser-cdp-artifact.mjs ] && node /tmp/repi-browser-cdp-artifact.mjs ${targetArg} /tmp/repi-browser-artifact.json || printf '%s\n' 'rerun re_lane plan to regenerate CDP artifact scaffold'`,
			evidence: "repeat CDP-backed browser artifact capture with request/response/WS/storage serialization",
		});
		followups.push({
			label: "browser-replay-eval-rerun",
			command: `[ -f /tmp/repi-replay-eval.mjs ] && [ -f /tmp/repi-browser-artifact.json ] && node /tmp/repi-replay-eval.mjs /tmp/repi-browser-artifact.json || printf '%s\n' 'capture /tmp/repi-browser-artifact.json before replay evaluation'`,
			evidence: "evaluate whether captured browser request replays with matching status/body drift",
		});
		followups.push({
			label: "browser-route-graph-rerun",
			command: `[ -f /tmp/repi-route-graph.mjs ] && node /tmp/repi-route-graph.mjs /tmp/repi-browser-artifact.json ${targetArg} || printf '%s\n' 'rerun browser-route-graph-scaffold after CDP artifact capture'`,
			evidence: "regenerate normalized route graph from latest browser artifact",
		});
	}
	if (signals.artifactAnchors.length > 0) {
		const artifactPath = signals.artifactAnchors[0] ?? "/tmp/repi-browser-artifact.json";
		followups.push({
			label: "browser-cdp-artifact-review",
			command: `python3 - <<'PY'\nimport json, pathlib\np = pathlib.Path(${pythonString(artifactPath)})\nprint('[browser-artifact-review]', p)\nobj = json.loads(p.read_text())\nprint('requests=', len(obj.get('requests', [])), 'responses=', len(obj.get('responses', [])), 'websockets=', len(obj.get('websockets', [])), 'wsFrames=', len(obj.get('wsFrames', [])), 'cookies=', len(obj.get('cookies', [])))\nfor req in obj.get('requests', [])[:12]:\n    print('REQ', req.get('method'), req.get('url'), 'type=' + str(req.get('resourceType')), 'initiator=' + str(req.get('initiator')))\nfor res in obj.get('responses', [])[:12]:\n    print('RES', res.get('status'), res.get('url'), res.get('mimeType'))\nprint('storage=', json.dumps(obj.get('storage', {}), ensure_ascii=False)[:500])\nPY`,
			evidence: "review serialized CDP artifact for replayable requests, auth/session storage, and websocket frames",
		});
		followups.push({
			label: "browser-replay-eval-artifact-rerun",
			command: `[ -f /tmp/repi-replay-eval.mjs ] && node /tmp/repi-replay-eval.mjs ${shellQuote(artifactPath)} || printf '%s\n' 'rerun browser-replay-evaluator-scaffold first'`,
			evidence: "replay evaluator bound to captured browser artifact path",
		});
	}
	if (signals.websocketAnchors.length > 0) {
		const wsUrl = signals.websocketAnchors[0] ?? "<WS_URL>";
		followups.push({
			label: "browser-xhr-ws-replay-scaffold",
			command: `node - <<'NODE'\nconst url = ${pythonString(wsUrl)};\nconsole.log('[repi-ws-replay] target=', url);\nconsole.log('Use captured cookies/headers/subprotocols from browser-xhr-ws runtime anchors before replay.');\nNODE`,
			evidence: "websocket replay scaffold seeded from captured runtime endpoint",
		});
	}
}
