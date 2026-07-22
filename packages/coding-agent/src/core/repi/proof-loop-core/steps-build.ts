/** Proof-loop step builders. */
// Landmark: buildProofLoopStepSpecs proofLoopSourceArtifacts runtime-adapter
/** Proof-loop step build / next actions / refresh. */
import type { ProofLoopStep } from "../proof-loop-runtime.ts";
import { proofLoopSourceArtifacts } from "./gaps.ts";
import { buildProofLoopStepSpecs } from "./steps-build-specs.ts";

export function buildProofLoopSteps(target?: string): ProofLoopStep[] {
	const sourceArtifacts = proofLoopSourceArtifacts(target);
	const { specs, targetRuntimeCommands, sourceArtifactsMeta } = buildProofLoopStepSpecs(target);
	const targetRuntimeCommandSet = new Set(targetRuntimeCommands);
	const { compactResumePath, failureSignatureSourceArtifacts, graphGapItems } = sourceArtifactsMeta;
	return specs.map(([phase, command], index) => {
		const placeholderBlocked = /<target>/i.test(command) && !target;
		return {
			id: `proof:${index + 1}:${phase}`,
			phase,
			command,
			status: placeholderBlocked ? "blocked" : "ready",
			reason: placeholderBlocked
				? "target placeholder is unresolved"
				: phase === "compact-resume"
					? "source=compact_resume"
					: phase === "failure-signature"
						? "source=failure_signature_priority"
						: phase === "attack-graph" || phase === "runtime-adapter"
							? targetRuntimeCommandSet.has(command)
								? "source=target_auto_detection"
								: "source=attack_graph_gap"
							: undefined,
			sourceArtifacts:
				phase === "compact-resume"
					? [compactResumePath, ...sourceArtifacts]
					: phase === "failure-signature"
						? failureSignatureSourceArtifacts
						: phase === "attack-graph" || phase === "runtime-adapter"
							? targetRuntimeCommandSet.has(command)
								? sourceArtifacts
								: Array.from(new Set(graphGapItems.flatMap((item: any) => item.sourceArtifacts))).slice(0, 16)
							: sourceArtifacts,
		};
	});
}
