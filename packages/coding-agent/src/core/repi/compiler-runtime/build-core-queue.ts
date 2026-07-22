/** Compiler next-operator queue claim-check packing. */

import { compilerNextOperatorQueue } from "./pure-queue.ts";

export function buildCompilerNextOperatorQueue(input: { claimCheckInputs: any; verifier: any }): string[] {
	const { claimCheckInputs, verifier } = input;
	return Array.from(
		new Set([
			...(claimCheckInputs.strictClaimCheck.status === "pass"
				? []
				: [
						"re_complete audit # writes local claim-release marker",
						"re_supervisor repair",
						"re_context pack",
						"re_operator dispatch <target> 2",
						"re_proof_loop run <target> 4 2",
					]),
			...(claimCheckInputs.structuredClaimMergeCheck.status === "blocked"
				? ["re_swarm merge", "re_supervisor repair", "re_verifier matrix", "re_compiler draft"]
				: []),
			...compilerNextOperatorQueue(verifier),
		]),
	).slice(0, 24);
}
