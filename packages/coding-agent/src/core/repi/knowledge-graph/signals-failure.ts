/** Knowledge-graph: compact-resume + failure-signature signal nodes. */

import { runtimeFailureLedgerPath, runtimeRepairQueuePath } from "../storage/paths/core.ts";
import { truncateMiddle } from "../text.ts";
import { failureSignaturePriorityReport } from "./deps.ts";
import { compactResumeKnowledgeSignals } from "./helpers.ts";
import type { KnowledgeEdge, KnowledgeNode } from "./types.ts";

export function appendCompactFailureSignalNodes(input: {
	nodes: KnowledgeNode[];
	edges: KnowledgeEdge[];
	missionNodeId: string;
	route?: string;
	target?: string;
	missionTask?: string;
}): {
	compactResumeSignals: ReturnType<typeof compactResumeKnowledgeSignals>;
	failureSignature: ReturnType<typeof failureSignaturePriorityReport>;
} {
	const { nodes, edges, missionNodeId, route } = input;
	const options = { target: input.target ?? input.missionTask };
	const mission = { task: input.missionTask } as { task?: string };
	const compactResumeSignals = compactResumeKnowledgeSignals(options.target ?? mission?.task);
	if (compactResumeSignals.lines.length || compactResumeSignals.caseMemory.length) {
		const id = "compact-resume:telemetry";
		nodes.push({
			id,
			kind: "compact_resume_telemetry",
			label: `compact resume ${compactResumeSignals.status}: ${compactResumeSignals.path}`,
			path: compactResumeSignals.path,
			route,
			score: compactResumeSignals.status === "done" ? 85 : compactResumeSignals.status === "blocked" ? 45 : 65,
			tags: [
				"compact-resume",
				"context-resume",
				compactResumeSignals.status,
				...(compactResumeSignals.status === "blocked" ? ["repair"] : ["playbook"]),
			],
		});
		edges.push({
			from: missionNodeId,
			to: id,
			kind: compactResumeSignals.status === "blocked" ? "repairs" : "suggests",
			label: "compact-resume-telemetry",
		});
		for (const [index, line] of compactResumeSignals.caseMemory.slice(0, 12).entries()) {
			const nodeId = `compact-resume-case:${index + 1}`;
			nodes.push({
				id: nodeId,
				kind: "compact_resume_case_memory",
				label: truncateMiddle(line, 180),
				path: compactResumeSignals.path,
				route,
				score: /status=done|compact_resume_success/.test(line)
					? 88
					: /status=blocked|compact_resume_repair/.test(line)
						? 55
						: 70,
				tags: ["compact-resume", "case-memory", /repair|blocked/.test(line) ? "repair" : "playbook"],
			});
			edges.push({
				from: id,
				to: nodeId,
				kind: /repair|blocked/.test(line) ? "repairs" : "suggests",
				label: "compact-resume-case-memory",
			});
		}
	}
	const failureSignature = failureSignaturePriorityReport(options.target ?? mission?.task);
	if (failureSignature.rows.length || failureSignature.repairQueue.length) {
		const id = "failure-signature:priority";
		nodes.push({
			id,
			kind: "failure_signature_priority",
			label: `runtime failure priority exhausted=${failureSignature.exhaustedCount} repeated=${failureSignature.repeatedCount}`,
			path: runtimeFailureLedgerPath(),
			route,
			score: failureSignature.exhaustedCount ? 95 : failureSignature.repeatedCount ? 85 : 70,
			tags: ["failure-signature", "runtime-ledger", "repair", "priority"],
		});
		edges.push({ from: missionNodeId, to: id, kind: "repairs", label: "runtime-failure-priority" });
		for (const [index, line] of failureSignature.rows.slice(0, 12).entries()) {
			const nodeId = `failure-signature-priority:${index + 1}`;
			nodes.push({
				id: nodeId,
				kind: "failure_signature_priority",
				label: truncateMiddle(line, 180),
				path: runtimeFailureLedgerPath(),
				route,
				score: /status=exhausted/.test(line) ? 98 : /repeats=[2-9]/.test(line) ? 88 : 72,
				tags: [
					"failure-signature",
					"runtime-ledger",
					"repair",
					/status=exhausted/.test(line) ? "exhausted" : "queued",
				],
			});
			edges.push({ from: id, to: nodeId, kind: "repairs", label: "failure-signature-priority-row" });
		}
		for (const [index, line] of failureSignature.repairQueue.slice(0, 12).entries()) {
			const nodeId = `failure-signature-repair:${index + 1}`;
			nodes.push({
				id: nodeId,
				kind: "failure_signature_repair",
				label: truncateMiddle(line, 180),
				path: runtimeRepairQueuePath(),
				route,
				score: /ready=true/.test(line) ? 82 : 45,
				tags: ["failure-signature", "repair-queue", /ready=true/.test(line) ? "ready" : "blocked"],
			});
			edges.push({ from: id, to: nodeId, kind: "repairs", label: "failure-signature-repair-queue" });
		}
	}
	return { compactResumeSignals, failureSignature };
}
