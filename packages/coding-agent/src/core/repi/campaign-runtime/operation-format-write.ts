/** Write/parse/build operation artifact output. */
import { join } from "node:path";
import { ensureReconStorage } from "../resources.ts";
import type { OperationArtifact } from "../runtime-types/operation.ts";
import { evidenceOperationsDir, readTextFile as readText, writePrivateTextFile } from "../storage.ts";
import { slug, truncateMiddle } from "../text.ts";
import { appendEvidence, updateMissionCheckpoint } from "./deps.ts";
import { buildOperation, latestOperationArtifactPath } from "./operation-build.ts";
import { formatOperation } from "./operation-format-text.ts";

export function writeOperationArtifact(operation: OperationArtifact): string {
	ensureReconStorage();
	const path = join(
		evidenceOperationsDir(),
		`${operation.timestamp.replace(/[:.]/g, "-")}-${slug(operation.route ?? "operation")}-${operation.mode}.md`,
	);
	writePrivateTextFile(
		path,
		[
			"# REPI Operation Artifact",
			"",
			formatOperation(operation, path),
			"",
			"## Executed",
			"",
			...(operation.executed.length
				? operation.executed.map((item: any) => `- ${item.stepId} status=${item.status} command=${item.command}`)
				: ["- none"]),
			"",
			"## JSON",
			"",
			"```json",
			JSON.stringify(operation, null, 2),
			"```",
			"",
		].join("\n"),
	);
	appendEvidence({
		kind: "artifact",
		title: `operation-${operation.mode} ${operation.missionId ?? "no-mission"}`,
		fact: `Built operation queue with ${operation.steps.length} step(s), ${operation.executed.length} executed, ${operation.blocked.length} blocked`,
		command: `re_operation ${operation.mode}`,
		path,
		verify: `cat ${path}`,
		confidence: "campaign/phase-runner operation queue",
	});
	updateMissionCheckpoint("operation_queue_ready", "done", path);
	return path;
}

export function buildOperationOutput(
	action: "plan" | "show" | "next" = "plan",
	options: { target?: string; task?: string } = {},
): string {
	if (action === "show") {
		const path = latestOperationArtifactPath();
		if (!path) return "operation_queue:\nstatus: missing\nnext: re_operation plan";
		return truncateMiddle(readText(path), 14000);
	}
	const operation = buildOperation({ ...options, mode: "plan" });
	const path = writeOperationArtifact(operation);
	if (action === "next") {
		const next = operation.steps.find((step: any) => step.status === "ready");
		return [
			formatOperation(operation, path),
			"",
			"next_ready_step:",
			next ? `- ${next.id} ${next.command}` : "- none",
		].join("\n");
	}
	return formatOperation(operation, path);
}

export function parseOperationArtifact(path: string): OperationArtifact | undefined {
	const match = /```json\s*([\s\S]*?)\s*```/m.exec(readText(path));
	if (!match?.[1]) return undefined;
	try {
		return JSON.parse(match[1]) as OperationArtifact;
	} catch {
		return undefined;
	}
}
