/** Write kernel artifact + memory index. */
import { join } from "node:path";
import { ensureReconStorage } from "../resources.ts";
import { evidenceKernelDir, memoryPath, writePrivateTextFile } from "../storage.ts";
import { slug } from "../text.ts";
import { formatKernelArtifact } from "./artifact-format-core.ts";
import { d } from "./deps.ts";
import type { KernelArtifact } from "./types.ts";

export function writeKernelArtifact(kernel: KernelArtifact): string {
	ensureReconStorage();
	const path = join(
		evidenceKernelDir(),
		`${kernel.timestamp.replace(/[:.]/g, "-")}-${slug(kernel.route ?? "kernel")}-${kernel.mode}.md`,
	);
	writePrivateTextFile(
		path,
		[
			"# REPI Execution Kernel Artifact",
			"",
			formatKernelArtifact(kernel, path),
			"",
			"## JSON",
			"",
			"```json",
			JSON.stringify(kernel, null, 2),
			"```",
			"",
		].join("\n"),
	);
	writePrivateTextFile(
		memoryPath("execution-kernel.md"),
		[
			"# REPI Execution Kernel",
			"",
			`Updated: ${kernel.timestamp}`,
			`Artifact: ${path}`,
			"",
			"## Directive stack",
			...kernel.directiveStack.map((item: any) => `- ${item}`),
			"",
			"## Execution invariants",
			...kernel.executionInvariants.map((item: any) => `- ${item}`),
			"",
			"## Operator command floor",
			...kernel.operatorCommandFloor.map((item: any) => `- ${item}`),
			"",
			"## Specialist capability matrix",
			...kernel.specialistCapabilityMatrix.map((item: any) => `- ${item}`),
			"",
			"## Proof exit criteria",
			...kernel.proofExitCriteria.map((item: any) => `- ${item}`),
			"",
			"## Refusal to execution rules",
			...kernel.refusalToExecutionRules.map((item: any) => `- ${item}`),
			"",
			"## Tool call policy",
			...kernel.toolCallPolicy.map((item: any) => `- ${item}`),
			"",
		].join("\n"),
	);
	d().appendEvidence({
		kind: "artifact",
		title: `execution-kernel-${kernel.mode} ${kernel.missionId ?? "no-mission"}`,
		fact: `Execution kernel ${kernel.mode}: directives=${kernel.directives.length}, next_actions=${kernel.nextActions.length}`,
		command: `re_kernel ${kernel.mode}`,
		path,
		verify: `cat ${path}`,
		confidence: "profile directive kernel",
	});
	d().updateMissionCheckpoint("execution_kernel_ready", "done", path);
	d().updateMissionCheckpoint("memory_or_evolution_written", "done", memoryPath("execution-kernel.md"));
	return path;
}
