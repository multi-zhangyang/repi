/** Map command lists into proof-loop refresh steps. */
import type { ProofLoopStep } from "../proof-loop-runtime.ts";

export function mapProofLoopRefreshCommandSteps(params: {
	commands: string[];
	existingCommands: Set<string>;
	baseIndex: number;
	phase: ProofLoopStep["phase"] | ((command: string) => ProofLoopStep["phase"]);
	reason: string | ((command: string) => string | undefined);
	sourceArtifacts: string[] | ((command: string) => string[]);
	target?: string;
	limit?: number;
}): ProofLoopStep[] {
	const limit = params.limit ?? 4;
	return params.commands
		.filter((command: any) => !params.existingCommands.has(command))
		.slice(0, limit)
		.map((command: any, index: any) => {
			const phase = typeof params.phase === "function" ? params.phase(command) : params.phase;
			const reason = typeof params.reason === "function" ? params.reason(command) : params.reason;
			const sourceArtifacts =
				typeof params.sourceArtifacts === "function" ? params.sourceArtifacts(command) : params.sourceArtifacts;
			return {
				id: `proof:${params.baseIndex + index + 1}:${phase}`,
				phase,
				command,
				status: /<target>/i.test(command) && !params.target ? "blocked" : "ready",
				reason: /<target>/i.test(command) && !params.target ? "target placeholder is unresolved" : reason,
				sourceArtifacts,
			};
		});
}
