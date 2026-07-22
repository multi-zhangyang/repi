/** JS-signing specialist followups + reverse capture gates. */
import type { LaneCommand } from "../../../lane-commands/types.ts";

export function jsSigningEvidenceFollowups(): LaneCommand[] {
	return [
		{
			label: "js-signing-observed-rebuild",
			command: `[ -f /tmp/repi-signing-rebuild.mjs ] && REPI_OBSERVED="\${REPI_OBSERVED:-{}}" node /tmp/repi-signing-rebuild.mjs || rg -n "sign|signature|nonce|timestamp|crypto|encrypt|decrypt|fetch\\(|XMLHttpRequest" . | head -260`,
			evidence: "turn captured hook arguments into local Node signing rebuild",
		},
		{
			label: "js-signing-hook-rerun",
			command: `[ -f /tmp/repi-js-runtime-hooks.js ] && sed -n '1,260p' /tmp/repi-js-runtime-hooks.js || rg -n "fetch\\(|XMLHttpRequest|WebSocket|crypto\\.subtle|sign|nonce|timestamp" . | head -260`,
			evidence: "rerun or review browser hooks around first-divergence point",
		},
		{
			label: "js-signing-normalizer-rerun",
			command: `[ -f /tmp/repi-js-normalize.mjs ] && REPI_JS_LOG="\${REPI_JS_LOG:-}" REPI_OBSERVED="\${REPI_OBSERVED:-{}}" node /tmp/repi-js-normalize.mjs || printf '%s\n' 'rerun js-signing-observation-normalizer after capturing hook logs'`,
			evidence: "normalize captured fetch/XHR/crypto hook logs into observed signing artifact",
		},
		{
			label: "js-first-divergence-rerun",
			command: `[ -f /tmp/repi-js-first-divergence.mjs ] && REPI_OBSERVED="\${REPI_OBSERVED:-}" REPI_EXPECTED_SIGNATURE="\${REPI_EXPECTED_SIGNATURE:-}" REPI_CANDIDATE_SIGNATURE="\${REPI_CANDIDATE_SIGNATURE:-}" REPI_SECRET="\${REPI_SECRET:-}" node /tmp/repi-js-first-divergence.mjs || printf '%s\n' 'rerun js-signing-first-divergence-scaffold after observed artifact exists'`,
			evidence: "compare rebuilt candidate signature against observed signature and identify first divergence",
		},
		{
			label: "js-signing-replay-harness-rerun",
			command: `[ -f /tmp/repi-js-replay-harness.mjs ] && REPI_REPLAY_URL="\${REPI_REPLAY_URL:-}" REPI_METHOD="\${REPI_METHOD:-GET}" REPI_HEADERS="\${REPI_HEADERS:-{}}" REPI_SIGNATURE_KEY="\${REPI_SIGNATURE_KEY:-}" REPI_SIGNATURE_VALUE="\${REPI_SIGNATURE_VALUE:-}" node /tmp/repi-js-replay-harness.mjs || printf '%s\n' 'rerun js-signing-replay-harness-scaffold and set replay env'`,
			evidence: "validate rebuilt signature through signed request replay and response drift",
		},
	];
}

export function jsSigningReverseCaptureFollowups(targetArg: string): LaneCommand[] {
	return [
		{
			label: `web-js-signing-domain-proof-exit`,
			command: `re_domain_proof_exit show`,
			evidence: "reverse runtime capture gate",
		} as any,
		{
			label: `web-js-signing-complete-audit`,
			command: `re_complete audit`,
			evidence: "reverse completion audit",
		} as any,
		{
			label: `web-js-signing-runtime-adapter`,
			command: `re_runtime_adapter run ${targetArg}`,
			evidence: "runtime adapter capture",
		} as any,
		{
			label: `web-js-signing-live-browser`,
			command: `re_live_browser run ${targetArg}`,
			evidence: "web live proof path",
		} as any,
	];
}

export function jsSigningNextLane(counts: {
	firstDivergence: number;
	replay: number;
	hooks: number;
	crypto: number;
	normalized: number;
}): string | undefined {
	if (counts.firstDivergence > 0 || counts.replay > 0) return "verify/replay";
	if (counts.hooks > 0 || counts.crypto > 0 || counts.normalized > 0) return "rebuild/verify";
	return undefined;
}
