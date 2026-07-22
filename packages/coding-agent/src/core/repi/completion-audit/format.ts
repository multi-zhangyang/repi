/** Completion audit formatting (lean surface for re_complete). */

import { auditCompletion } from "./audit.ts";
import type { CompletionAudit } from "./audit-claims.ts";

export function formatCompletionAuditFromAudit(audit: CompletionAudit): string {
	const warnings = audit.warnings ?? [];
	const optionalPending = warnings.filter((w) => /pending optional check/i.test(w));
	const reverseSatisfied = warnings.filter((w) =>
		/reverse_proof: runtime proof capture satisfied|reverse_proof: technique capture bind_ready=true|reverse_domain_proof_align: reverse proof_exit and domain proof-exit both satisfied/i.test(
			w,
		),
	);
	const proofBits = warnings
		.filter((w) => /reverse_anchor: reverse\.(proof_exit|bind_ready)=/i.test(w))
		.map((w) => w.replace(/^reverse_anchor:\s*/i, ""));
	const realWarnings = warnings.filter(
		(w) =>
			!optionalPending.includes(w) &&
			!reverseSatisfied.includes(w) &&
			!/reverse_anchor: reverse\.(proof_exit|bind_ready)=/i.test(w),
	);
	return [
		audit.ready ? "completion_status: ready" : "completion_status: blocked",
		audit.mission ? `mission_id: ${audit.mission.id}` : "mission: none",
		audit.mission ? `task: ${audit.mission.task}` : undefined,
		audit.mission ? `route: ${audit.mission.route?.domain ?? "unknown"}` : undefined,
		audit.domainProofExitClosure
			? [
					`domain_proof_exit_closure: status=${audit.domainProofExitClosure.status} domain=${audit.domainProofExitClosure.domainId ?? "unmapped"} toolchain=${audit.domainProofExitClosure.toolchainStatus ?? "unknown"}`,
					`matched=${(audit.domainProofExitClosure.matchedProofExits ?? []).length} missing=${(audit.domainProofExitClosure.missingProofExits ?? []).length}`,
					`corpus_sha256=${audit.domainProofExitClosure.artifactCorpusHash ?? "none"}`,
				].join("\n")
			: "domain_proof_exit_closure: missing",
		"blockers:",
		...(audit.blockers.length ? audit.blockers.map((item: any) => `- ${item}`) : ["- none"]),
		"proof_summary:",
		...(proofBits.length ? proofBits.map((item) => `- ${item}`) : ["- none"]),
		...(audit.ready ? ["reverse_runtime_gate: satisfied"] : []),
		"optional_pending_checks:",
		...(optionalPending.length
			? optionalPending.map(
					(item) => `- ${item.replace(/^pending optional check(?: \(reverse proof ready\))?:\s*/i, "")}`,
				)
			: ["- none"]),
		"warnings:",
		...(realWarnings.length ? realWarnings.map((item: any) => `- ${item}`) : ["- none"]),
		"required_output:",
		"- Outcome / Key Evidence / Verification / Next Step",
		"- evidence block with paths, offsets, hashes, commands, requests, hook points, or state transitions",
		"- reproducible commands or explicit reason why no new command applies",
	]
		.filter(Boolean)
		.join("\n");
}

export function formatCompletionAudit(): string {
	return formatCompletionAuditFromAudit(auditCompletion());
}
