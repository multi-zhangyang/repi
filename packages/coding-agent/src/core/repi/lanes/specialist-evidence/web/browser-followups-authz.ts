/** Browser authz/IDOR/state followups (runtime reverse proof path). */

import { reverseDomainCaptureNextCommands } from "../../../reverse-capture.ts";
import type { LaneCommand } from "../types.ts";
import type { BrowserEvidenceSignals } from "./browser-signals.ts";

export function pushBrowserAuthzFollowups(
	followups: LaneCommand[],
	signals: BrowserEvidenceSignals,
	targetArg: string,
	packTarget?: string,
): void {
	if (packTarget && /^https?:\/\//i.test(packTarget)) {
		followups.push({
			label: "browser-auth-matrix-rerun",
			command: `[ -f /tmp/repi-auth-matrix.mjs ] && COOKIE_A="\${COOKIE_A:-}" COOKIE_B="\${COOKIE_B:-}" AUTH_A="\${AUTH_A:-}" AUTH_B="\${AUTH_B:-}" node /tmp/repi-auth-matrix.mjs ${targetArg} || printf '%s\n' 'rerun browser-auth-matrix-scaffold and set principal cookies/tokens'`,
			evidence: "compare anonymous/principal-A/principal-B authorization boundaries per route",
		});
		followups.push({
			label: "browser-idor-bola-probe-rerun",
			command: `[ -f /tmp/repi-idor-bola-probe.mjs ] && REPI_IDOR_BASELINE="\${REPI_IDOR_BASELINE:-}" REPI_IDOR_ALT="\${REPI_IDOR_ALT:-}" COOKIE_A="\${COOKIE_A:-}" AUTH_A="\${AUTH_A:-}" node /tmp/repi-idor-bola-probe.mjs || printf '%s\n' 'generate route graph and set REPI_IDOR_BASELINE/REPI_IDOR_ALT for controlled object diff'`,
			evidence: "rerun controlled IDOR/BOLA alternate-object probe using route graph candidates",
		});
		followups.push({
			label: "browser-authz-state-machine-rerun",
			command: `[ -f /tmp/repi-authz-state-machine.mjs ] && COOKIE_A="\${COOKIE_A:-}" COOKIE_B="\${COOKIE_B:-}" AUTH_A="\${AUTH_A:-}" AUTH_B="\${AUTH_B:-}" node /tmp/repi-authz-state-machine.mjs ${targetArg} || printf '%s\n' 'rerun browser-authz-state-machine-scaffold and attach principal cookies/tokens'`,
			evidence: "rerun multi-principal authorization state machine across captured routes",
		});
		followups.push({
			label: "browser-authz-sequence-replay-rerun",
			command: `[ -f /tmp/repi-authz-sequence-replay.mjs ] && COOKIE_A="\${COOKIE_A:-}" COOKIE_B="\${COOKIE_B:-}" AUTH_A="\${AUTH_A:-}" AUTH_B="\${AUTH_B:-}" node /tmp/repi-authz-sequence-replay.mjs ${targetArg} || printf '%s\n' 'rerun browser-authz-sequence-replay-scaffold after route graph capture'`,
			evidence: "rerun authorization-sensitive request sequence for status/body-hash drift",
		});
		followups.push({
			label: "browser-authz-object-ownership-rerun",
			command: `[ -f /tmp/repi-authz-object-ownership.mjs ] && REPI_OWNER_URL="\${REPI_OWNER_URL:-}" COOKIE_A="\${COOKIE_A:-}" COOKIE_B="\${COOKIE_B:-}" AUTH_A="\${AUTH_A:-}" AUTH_B="\${AUTH_B:-}" node /tmp/repi-authz-object-ownership.mjs ${targetArg} || printf '%s\n' 'set REPI_OWNER_URL plus principal cookies/tokens before ownership check'`,
			evidence: "rerun owner-vs-alternate-principal object authorization check",
		});
		followups.push({
			label: "browser-authz-state-rollback-rerun",
			command: `[ -f /tmp/repi-authz-state-rollback.mjs ] && REPI_ROLLBACK_URL="\${REPI_ROLLBACK_URL:-}" REPI_ROLLBACK_BODY="\${REPI_ROLLBACK_BODY:-}" REPI_ROLLBACK_RESTORE_BODY="\${REPI_ROLLBACK_RESTORE_BODY:-}" COOKIE_A="\${COOKIE_A:-}" AUTH_A="\${AUTH_A:-}" node /tmp/repi-authz-state-rollback.mjs ${targetArg} || printf '%s\n' 'set rollback URL/body/restore body to prove state transition and cleanup'`,
			evidence: "rerun state-changing authorization proof with before/after/rollback hashes",
		});
	}
	const {
		routeGraphLines,
		authMatrixLines,
		idorProbeLines,
		authzStateLines,
		authzSequenceLines,
		authzOwnershipLines,
		authzRollbackLines,
		webAuthzStaticLines,
		webSchemaLines,
		webStateSourceLines,
	} = signals;
	if (
		routeGraphLines.length > 0 ||
		authMatrixLines.length > 0 ||
		idorProbeLines.length > 0 ||
		authzStateLines.length > 0 ||
		authzSequenceLines.length > 0 ||
		authzOwnershipLines.length > 0 ||
		authzRollbackLines.length > 0 ||
		webAuthzStaticLines.length > 0 ||
		webSchemaLines.length > 0 ||
		webStateSourceLines.length > 0
	) {
		followups.push({
			label: "web-api-authz-static-rerun",
			command:
				"python3 - <<'PY'\nprint('[web-authz-static-rerun] rerun web-api-authz-static-scaffold via re_lane plan/run; then bind risky id lookup to browser auth matrix or source-level guard proof')\nPY",
			evidence: "rerun or review static route/auth/owner scanner and bind risks to runtime authz probes",
		});
		followups.push({
			label: "web-api-schema-diff-rerun",
			command:
				"python3 - <<'PY'\nprint('[web-schema-rerun] rerun web-api-schema-diff-scaffold; compare id_params/security rows with route graph and auth matrix')\nPY",
			evidence: "rerun OpenAPI/GraphQL auth parameter scanner and compare with captured route graph",
		});
		followups.push({
			label: "web-api-state-source-rerun",
			command:
				"python3 - <<'PY'\nprint('[web-state-source-rerun] rerun web-api-state-source-scaffold; prove one mutating route with before/after/rollback hashes')\nPY",
			evidence: "rerun state mutation source scanner and bridge to rollback proof",
		});
		followups.push({
			label: "browser-authz-report-scaffold",
			command: `python3 - <<'PY'\nimport json, pathlib\nprint('[authz-report] inputs=/tmp/repi-route-graph.json /tmp/repi-browser-artifact.json')\nif pathlib.Path('/tmp/repi-route-graph.json').exists():\n    graph=json.loads(pathlib.Path('/tmp/repi-route-graph.json').read_text())\n    print('[authz-report] routes=', len(graph), 'idor_candidates=', sum(len(r.get('idorParams', [])) for r in graph))\n    for r in graph[:20]: print('ROUTE', r.get('method'), r.get('path'), 'auth=' + str(r.get('auth')), 'idor=' + ','.join(r.get('idorParams', [])))\nprint('Next: attach COOKIE_A/COOKIE_B or AUTH_A/AUTH_B, rerun browser-auth-matrix-rerun, then set REPI_IDOR_BASELINE/ALT for one candidate.')\nPY`,
			evidence: "authz report scaffold consolidating route graph, auth matrix, and IDOR/BOLA candidates",
		});
		followups.push({
			label: "browser-authz-state-report-scaffold",
			command: `python3 - <<'PY'\nimport json, pathlib\npaths=[\n  '/tmp/repi-authz-state-machine.json',\n  '/tmp/repi-authz-sequence.json',\n  '/tmp/repi-authz-ownership.json',\n  '/tmp/repi-authz-rollback.json',\n]\nprint('[authz-state-report] inputs=' + ' '.join(paths))\nfor raw in paths:\n    p=pathlib.Path(raw)\n    print('[authz-state-report]', raw, 'exists=' + str(p.exists()))\n    if not p.exists(): continue\n    obj=json.loads(p.read_text())\n    if raw.endswith('state-machine.json'):\n        print('STATE_MACHINE principals=', ','.join(obj.get('principals', [])), 'routes=', len(obj.get('routes', [])), 'states=', len(obj.get('states', [])))\n    elif raw.endswith('sequence.json'):\n        print('SEQUENCE steps=', len(obj.get('sequence', [])))\n    elif raw.endswith('ownership.json'):\n        print('OWNERSHIP', obj.get('owner'), obj.get('status'))\n    elif raw.endswith('rollback.json'):\n        print('ROLLBACK', obj.get('before'), obj.get('after'), obj.get('restored'))\nprint('Next: prove one mutative route with ownership + rollback hashes before claim promotion.')\nPY`,
			evidence:
				"browser authz state report consolidating state machine, sequence, ownership, and rollback artifacts",
		});
	}
	const reverseNext = reverseDomainCaptureNextCommands({
		routeOrBlob: `web browser authz ${packTarget ?? ""} ${targetArg}`,
		target: packTarget,
		includeGates: true,
	}).slice(0, 3);
	for (const command of reverseNext) {
		followups.push({
			label: "reverse-runtime-capture-next",
			command,
			evidence: "reverse domain capture next for browser/authz runtime proof",
		});
	}
}
