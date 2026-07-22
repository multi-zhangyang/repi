/** Operator escalation/verification queue helpers. */
import { existsSync } from "node:fs";
import { readCurrentMission } from "../mission.ts";

export function operatorEscalationQueue(steps: any[], pendingGates: string[]): string[] {
	const queue = [
		...steps
			.filter((step: any) => step.status === "blocked")
			.map((step: any) => `repair blocked ${step.id}: ${step.reason ?? step.command}`),
		...pendingGates.slice(0, 12).map((checkpoint: any) => `close check: ${checkpoint}`),
	];
	if (pendingGates.includes("tool_index_checked")) queue.push("re_tool_index refresh");
	if (pendingGates.includes("passive_map_done")) queue.push("re_map <target> 2");
	if (pendingGates.includes("supervisor_review_ready")) queue.push("re_supervisor review");
	if (pendingGates.includes("reflection_memory_ready")) queue.push("re_reflect write");
	if (pendingGates.includes("context_pack_ready")) queue.push("re_context pack");
	queue.push("re_operator verify");
	return Array.from(new Set(queue)).slice(0, 24);
}
export function operatorVerificationLines(context: any, contextArtifact: string | undefined, steps: any[]): string[] {
	const mission = readCurrentMission();
	const artifactChecks = context.artifactIndex.map(
		(item: any) => `${item.kind}: ${existsSync(item.path) ? "ok" : "missing"} ${item.path}`,
	);
	const checkChecks = mission?.checkpoints.map((checkpoint: any) => `${checkpoint.name}: ${checkpoint.status}`) ?? [
		"mission: missing",
	];
	const ready = steps.filter((step: any) => step.status === "ready").length;
	const blocked = steps.filter((step: any) => step.status === "blocked").length;
	return [
		`context_artifact: ${contextArtifact && existsSync(contextArtifact) ? "ok" : "missing"} ${contextArtifact ?? "none"}`,
		`operator_steps: ready=${ready} blocked=${blocked} total=${steps.length}`,
		...checkChecks,
		...artifactChecks.slice(0, 16),
	];
}
