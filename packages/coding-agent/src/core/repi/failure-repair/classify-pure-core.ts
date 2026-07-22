/** Pure failure signature + category classification. */
import { createHash } from "node:crypto";
import type { RuntimeFailureCategory } from "./types.ts";

export function runtimeFailureSignature(input: {
	scope: string;
	category: RuntimeFailureCategory;
	command?: string;
	reason?: string;
}): string {
	const normalized = [input.scope, input.category, input.command ?? "", input.reason ?? ""]
		.join("\n")
		.replace(/\b20\d{2}-\d{2}-\d{2}T[0-9:.+-]+Z\b/g, "<timestamp>")
		.replace(/\s+/g, " ")
		.trim();
	return createHash("sha256").update(normalized).digest("hex");
}

export function runtimeFailureCategory(reason: string): RuntimeFailureCategory {
	if (
		/command not found|not found|No such file|cannot stat|ModuleNotFoundError|ImportError|missing tool|dependency/i.test(
			reason,
		)
	)
		return "tool_missing";
	if (/artifact missing|no .*artifact|stale|hash drift/i.test(reason)) return "artifact_stale";
	if (
		/proof_exit|domain_proof_exit|reverse_proof|reverse_proof_exit_missing|pending_runtime_capture|bind_ready\s*=\s*false|require_proof_exit_before_claim|technique without proof|mitre|cwe/i.test(
			reason,
		)
	)
		return "contract_gap";
	if (
		/blocked|unresolved|placeholder|checkpoint|claim|contract|budget|coverage|supervisor|verifier|compiler/i.test(
			reason,
		)
	)
		return "contract_gap";
	return "runtime_failed";
}
