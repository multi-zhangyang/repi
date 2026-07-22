/** Context-pack artifact assembly (resume brief, memory reports, pack object). */
import { createHash } from "node:crypto";
import { finalizeContextPackArtifact } from "./pack-assembly-finalize.ts";
import { buildContextPackFinalizeInput } from "./pack-assembly-finalize-input.ts";
import { mergeContextPackAssemblyNextCommands } from "./pack-assembly-next.ts";
import { buildContextPackResumeBrief } from "./pack-assembly-resume.ts";
import { recordContextPackCompactResumeTransitions } from "./pack-assembly-transitions.ts";
import type { ContextPackArtifact } from "./types.ts";

export function assembleContextPackArtifact(input: any): ContextPackArtifact {
	const {
		mission,
		active,
		pendingGates,
		reflectionPath,
		supervisorPath,
		reflection,
		supervisor,
		repairQueue,
		swarmRetryQueue,
		autonomousBudget,
		commanderMergeBudget,
		caseMemoryPlan,
		nextCommands: rawNextCommands,
		scope,
		contextPath,
		timestamp,
		route,
		target,
		mode,
		options,
		appendCompactResumeTransition,
		contextCompactionLedger,
	} = input;

	const nextCommands = mergeContextPackAssemblyNextCommands({
		route,
		target,
		mission,
		repairQueue,
		rawNextCommands,
	});
	const resumeBrief = buildContextPackResumeBrief({
		mission,
		active,
		pendingGates,
		reflectionPath,
		supervisorPath,
		reflection,
		supervisor,
		repairQueue,
		swarmRetryQueue,
		autonomousBudget,
		commanderMergeBudget,
		caseMemoryPlan,
		nextCommands,
	});
	const compactionLedger = contextCompactionLedger(timestamp);
	const idempotencyKey = createHash("sha256")
		.update(`${scope.sessionId}\n${contextPath}\n${nextCommands.join("\n")}`)
		.digest("hex");
	const closure = {
		status: (mode === "resume" ? "closed" : "open") as "open" | "closed",
		closedAt: mode === "resume" ? timestamp : null,
		reason: mode === "resume" ? "resume context rebuilt from verified state" : "context pack awaiting resume",
		verifiedBy: "re_context",
	};
	recordContextPackCompactResumeTransitions({
		mode,
		options,
		appendCompactResumeTransition,
		idempotencyKey,
		contextPath,
		autonomousBudget,
	});
	return finalizeContextPackArtifact(
		buildContextPackFinalizeInput({
			input,
			mission,
			active,
			route,
			target,
			mode,
			timestamp,
			scope,
			contextPath,
			idempotencyKey,
			closure,
			compactionLedger,
			resumeBrief,
			nextCommands,
		}),
	);
}
