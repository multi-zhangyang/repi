/** Proof-loop gap classification core (reverse proof_exit run-first). */
import type { RepiProofLoopGapClassification, RepiProofLoopGapItem } from "./types.ts";

export function classifyRepiProofLoopGap(item: RepiProofLoopGapItem): RepiProofLoopGapClassification {
	const text = `${item.source} ${item.text}`;
	if (/compact resume|resume command|proof loop has not been entered/i.test(text)) {
		return {
			klass: "compact_resume",
			priority: 1,
			action: "re_context resume -> re_runtime_adapter run -> re_domain_proof_exit show -> re_proof_loop run",
		};
	}
	if (/contradiction|counter[_ -]?evidence|refute|conflict/i.test(text)) {
		return { klass: "contradiction", priority: 1, action: "re_supervisor repair -> re_verifier matrix" };
	}
	if (/proof_spine_seed|runtime adapter proof[- ]exit complete|proof[- ]exit complete/i.test(text)) {
		return {
			klass: "proof_spine_seed",
			priority: 2,
			action: "re_verifier matrix -> re_compiler draft -> re_replayer run",
		};
	}
	if (
		/runtime adapter|re_runtime_adapter|missing-proof-exit|missing proof|parser_signal_summary|parser no-match/i.test(
			text,
		)
	) {
		return {
			klass: "runtime_adapter_gap",
			priority: 1,
			action: "re_runtime_adapter run -> re_domain_proof_exit show -> re_complete audit -> re_verifier matrix",
		};
	}
	if (
		/proof_exit|pending_runtime_capture|bind_ready\s*=\s*false|reverse_proof_exit_missing|require_proof_exit_before_claim|reverse_kind|technique without proof|domain_proof_exit/i.test(
			text,
		)
	) {
		return {
			klass: "runtime_adapter_gap",
			priority: 1,
			action:
				"re_native_runtime run|re_js_signing run|re_live_browser run|re_runtime_adapter run -> re_domain_proof_exit show -> re_complete audit",
		};
	}
	if (
		/proof_spine_seed|binary mitigation map|native-mitigation|pwn-mitigation|mitigation map matched|runtime proof spine/i.test(
			text,
		)
	) {
		return {
			klass: "proof_spine_seed",
			priority: 2,
			action: "re_verifier matrix -> re_compiler draft -> re_replayer run",
		};
	}
	if (
		/command not found|not recognized|No such file|cannot stat|cannot access|ModuleNotFoundError|ImportError|Cannot find module|ERR_MODULE_NOT_FOUND|permission denied|EACCES|ENOENT|missing tool|dependency|bootstrap/i.test(
			text,
		)
	) {
		return { klass: "tool_or_dependency", priority: 1, action: "re_bootstrap plan -> re_operator dispatch" };
	}
	if (/timeout|timed out|flake|unstable/i.test(text)) {
		return {
			klass: "timeout_or_flake",
			priority: 1,
			action: "re_autofix plan/apply with bounded timeout -> re_replayer run",
		};
	}
	if (/nonzero|exit=|failed:|blocked:|replay.*failed|stderr=/i.test(text)) {
		return { klass: "replay_failure", priority: 2, action: "re_autofix plan/apply -> re_replayer run" };
	}
	if (
		/target mismatch|unresolved target|target placeholder|state|session|cookie|auth|nonce|csrf|token|login|credential/i.test(
			text,
		)
	) {
		return {
			klass: "target_or_state",
			priority: 2,
			action: "re_map -> re_live_browser/re_web_authz_state or re_lane plan",
		};
	}
	if (
		/artifact missing|missing: run|no replay execution|verifier artifact missing|compiler artifact missing|replayer artifact missing/i.test(
			text,
		)
	) {
		return {
			klass: "missing_artifact",
			priority: 2,
			action: "re_verifier matrix -> re_compiler draft -> re_replayer run",
		};
	}
	if (/weak|missing=|weak=|insufficient|low confidence|quality/i.test(text)) {
		return { klass: "weak_evidence", priority: 3, action: "re_operator dispatch -> re_verifier matrix" };
	}
	return { klass: "unknown", priority: 4, action: "re_delegate plan -> re_swarm run -> re_supervisor review" };
}
