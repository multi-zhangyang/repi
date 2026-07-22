/** Completion memory reverse commands from blockers. */

import type { CompletionAudit } from "./completion-audit.ts";
import { reverseDomainCaptureNextCommands } from "./reverse-capture.ts";
import { uniqueNonEmpty } from "./text.ts";

export function completionMemoryReverseCommands(audit: CompletionAudit): string[] {
	if (audit.ready) return ["re_complete scaffold"];
	const reverseBlocked = audit.blockers.some((b: any) => /reverse|proof_exit/i.test(b));
	const reverseCmds = reverseBlocked
		? [
				...reverseDomainCaptureNextCommands({
					routeOrBlob: [audit.mission?.route.domain ?? "", audit.mission?.task ?? "", ...audit.blockers].join(
						"\n",
					),
					target: audit.mission?.task,
				}).slice(0, 4),
				"re_domain_proof_exit show",
				"re_complete audit",
			]
		: [];
	return uniqueNonEmpty(["re_operator plan", "re_proof_loop run", "re_autofix plan", ...reverseCmds], 16);
}

export function completionMemoryDomainTags(audit: CompletionAudit): string[] {
	return uniqueNonEmpty(
		[
			"completion",
			"claim_check",
			audit.mission?.route.domain,
			...(audit.blockers.some((b: any) => /reverse_proof_exit|reverse_domain_proof/i.test(b))
				? ["reverse", "proof_exit", "reverse_proof_exit_missing"]
				: []),
			...(audit.domainProofExitClosure ? ["domain_proof_exit", String(audit.domainProofExitClosure.status)] : []),
		],
		16,
	);
}

export function completionMemoryReuseRules(audit: CompletionAudit): string[] {
	return uniqueNonEmpty(
		[
			"Final output must include Outcome / Key Evidence / Verification / Next Step and an evidence block.",
			audit.ready
				? "All completion checkpoints green; promote report scaffold/final answer."
				: "Blocked completion must return to operator/proof/autofix checkpoints.",
			audit.blockers.some((b: any) => /reverse_proof_exit|proof_exit/i.test(b))
				? "Reverse technique claims require proof_exit and domain proof-exit closure before promotion."
				: undefined,
		],
		16,
	);
}
