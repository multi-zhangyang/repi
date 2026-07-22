/** Format kernel artifact with reverse domain next. */
import { reverseDomainCaptureNextCommands } from "../reverse-capture.ts";
import type { KernelArtifact } from "./types.ts";

export function formatKernelArtifact(kernel: KernelArtifact, path?: string): string {
	const reverseOpen = !kernel.proofExitCriteria?.some((item: any) =>
		/partial_runtime_capture|runtime_capture_strong|bind_ready/i.test(item),
	);
	const reverseNext = reverseOpen
		? reverseDomainCaptureNextCommands({
				routeOrBlob: `execution_kernel ${kernel.route ?? ""} ${kernel.target ?? ""}`,
				target: kernel.target,
				includeGates: true,
			}).slice(0, 2)
		: [];
	return [
		"execution_kernel:",
		path ? `kernel_artifact: ${path}` : undefined,
		`timestamp: ${kernel.timestamp}`,
		`mode: ${kernel.mode}`,
		`mission_id: ${kernel.missionId ?? "none"}`,
		`route: ${kernel.route ?? "none"}`,
		`target: ${kernel.target ?? "<none>"}`,
		"directive_stack:",
		...(kernel.directiveStack.length ? kernel.directiveStack.map((item: any) => `- ${item}`) : ["- none"]),
		"execution_invariants:",
		...(kernel.executionInvariants.length ? kernel.executionInvariants.map((item: any) => `- ${item}`) : ["- none"]),
		"operator_command_floor:",
		...(kernel.operatorCommandFloor.length
			? kernel.operatorCommandFloor.map((item: any) => `- ${item}`)
			: ["- none"]),
		"specialist_capability_matrix:",
		...(kernel.specialistCapabilityMatrix.length
			? kernel.specialistCapabilityMatrix.map((item: any) => `- ${item}`)
			: ["- none"]),
		"proof_exit_criteria:",
		...(kernel.proofExitCriteria.length ? kernel.proofExitCriteria.map((item: any) => `- ${item}`) : ["- none"]),
		"refusal_to_execution_rules:",
		...(kernel.refusalToExecutionRules.length
			? kernel.refusalToExecutionRules.map((item: any) => `- ${item}`)
			: ["- none"]),
		"domain_capabilities:",
		...(kernel.domainCapabilities.length ? kernel.domainCapabilities.map((item: any) => `- ${item}`) : ["- none"]),
		"tool_call_policy:",
		...(kernel.toolCallPolicy.length ? kernel.toolCallPolicy.map((item: any) => `- ${item}`) : ["- none"]),
		"artifact_contract:",
		...(kernel.artifactContract.length ? kernel.artifactContract.map((item: any) => `- ${item}`) : ["- none"]),
		"stall_recovery:",
		...(kernel.stallRecovery.length ? kernel.stallRecovery.map((item: any) => `- ${item}`) : ["- none"]),
		"operator_next_actions:",
		...(kernel.nextActions.length ? kernel.nextActions.map((item: any) => `- ${item}`) : ["- re_map <target> 2"]),
		`next_kernel_command: ${kernel.mode === "audit" ? "re_kernel build" : "re_map <target> 2"}`,
		"source_artifacts:",
		...(kernel.sourceArtifacts.length ? kernel.sourceArtifacts.map((item: any) => `- ${item}`) : ["- none"]),
		...(reverseNext.length ? ["reverse_domain_next:", ...reverseNext.map((cmd: any) => `- next: ${cmd}`)] : []),
	]
		.filter(Boolean)
		.join("\n");
}
