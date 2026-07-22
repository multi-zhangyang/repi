/** Build kernel artifact. */

import { readCurrentMission } from "../mission.ts";
import { ensureReconStorage } from "../resources.ts";
import { reverseDomainCaptureNextCommands } from "../reverse-capture.ts";
import { sanitizeTargetForCommand } from "../target.ts";
import {
	kernelArtifactContract,
	kernelDirectives,
	kernelDomainCapabilities,
	kernelExecutionInvariants,
	kernelNextActions,
	kernelOperatorCommandFloor,
	kernelProofExitCriteria,
	kernelRefusalToExecutionRules,
	kernelSourceArtifacts,
	kernelSpecialistCapabilityMatrix,
	kernelStallRecovery,
	kernelToolCallPolicy,
} from "./criteria.ts";
import type { KernelArtifact } from "./types.ts";

export function buildKernelArtifact(options: { target?: string; mode?: "build" | "audit" } = {}): KernelArtifact {
	ensureReconStorage();
	const mission = readCurrentMission();
	const safeTarget = sanitizeTargetForCommand(options.target) ?? sanitizeTargetForCommand(mission?.task);
	const sources = kernelSourceArtifacts();
	const directives = kernelDirectives(mission, sources);
	const directiveStack = directives
		.sort((a: any, b: any) => b.priority - a.priority)
		.map((directive: any) => `P${directive.priority} ${directive.id} [${directive.layer}] ${directive.directive}`);
	return {
		timestamp: new Date().toISOString(),
		missionId: mission?.id,
		route: mission?.route.domain,
		target: safeTarget,
		mode: options.mode ?? "build",
		directives,
		directiveStack,
		executionInvariants: kernelExecutionInvariants(),
		operatorCommandFloor: kernelOperatorCommandFloor(safeTarget),
		specialistCapabilityMatrix: kernelSpecialistCapabilityMatrix(mission?.route.domain),
		proofExitCriteria: kernelProofExitCriteria(),
		refusalToExecutionRules: kernelRefusalToExecutionRules(safeTarget),
		domainCapabilities: kernelDomainCapabilities(mission?.route.domain),
		toolCallPolicy: kernelToolCallPolicy(safeTarget),
		artifactContract: kernelArtifactContract(),
		stallRecovery: kernelStallRecovery(),
		nextActions: (() => {
			const base = kernelNextActions(mission, safeTarget);
			const blob = `${mission?.route?.domain ?? ""} ${safeTarget ?? ""} ${base.join(" ")}`;
			const reverseHeavy =
				/native|pwn|malware|firmware|reverse|binary|exploit|mobile|frontend|js|browser|authz|web|proof_exit|bind_ready/i.test(
					blob,
				);
			const reverseNext = reverseHeavy
				? reverseDomainCaptureNextCommands({
						routeOrBlob: blob,
						target: safeTarget,
						includeGates: true,
					}).slice(0, 3)
				: [];
			return Array.from(new Set([...reverseNext, ...base])).slice(0, 16);
		})(),
		sourceArtifacts: sources,
	};
}
