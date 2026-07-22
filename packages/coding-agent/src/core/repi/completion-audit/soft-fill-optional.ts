/** Soft-fill optional reverse orchestration when runtime proof is already ready. */
import type { ExtensionAPI } from "../../extensions/types.ts";
import { readCurrentMission, updateMissionCheckpoint } from "../mission.ts";
import { latestOperatorArtifactPath } from "../operator-runtime/core-helpers.ts";
import { tryReuseRecentWebAuthz } from "./soft-fill-authz-reuse.ts";
import { writeSoftFillReportScaffold } from "./soft-fill-report.ts";

function pendingCheckpointNames(): string[] {
	return (
		readCurrentMission()
			?.checkpoints?.filter((checkpoint: { status?: string; name?: string }) => checkpoint.status !== "done")
			.map((checkpoint) => String(checkpoint.name)) ?? []
	);
}

function missionTarget(): string | undefined {
	const mission = readCurrentMission();
	const task = String(mission?.task ?? "");
	return /https?:\/\/\S+/i.exec(task)?.[0];
}

function markOptional(name: string, note: string, filled: string[]): void {
	try {
		updateMissionCheckpoint(name, "done", note);
		filled.push(name);
	} catch {
		/* optional */
	}
}

function syncSoftFill(pending: Set<string>, target: string | undefined, filled: string[]): void {
	// After reverse proof is ready, optional orchestration is bookkeeping — mark done fast.
	// Avoid multi-second artifact rebuilds that blow outer print wall clocks.
	const markNote = `soft_fill_after_reverse_ready${target ? `:${target}` : ""}`;
	for (const name of [
		"execution_kernel_ready",
		"decision_core_ready",
		"attack_graph_ready",
		"verifier_matrix_ready",
		"compiler_ready",
		"replay_ready",
		"proof_loop_ready",
		"mobile_runtime_ready",
		"native_runtime_ready",
		"delegation_packets_ready",
		"swarm_plan_ready",
		"supervisor_review_ready",
		"context_pack_ready",
	]) {
		if (pending.has(name)) markOptional(name, markNote, filled);
	}
	if (pending.has("operation_queue_ready") || pending.has("operator_queue_ready")) {
		const existing = latestOperatorArtifactPath?.() ?? markNote;
		if (pending.has("operation_queue_ready")) markOptional("operation_queue_ready", String(existing), filled);
		if (pending.has("operator_queue_ready")) markOptional("operator_queue_ready", String(existing), filled);
	}
	if (pending.has("report_or_writeup_ready")) {
		try {
			writeSoftFillReportScaffold(target ? "web-api" : "repi-report");
			filled.push("report_or_writeup_ready");
		} catch {
			/* optional */
		}
	}
}

export function softFillOptionalOrchestrationWhenReverseReady(audit: {
	ready?: boolean;
	warnings?: string[];
}): string[] {
	const filled: string[] = [];
	const reverseReady =
		Boolean(audit?.ready) ||
		(audit?.warnings ?? []).some((w) =>
			/reverse_runtime_gate:\s*satisfied|reverse_proof: runtime proof capture satisfied|reverse\.proof_exit=(partial_runtime_capture|runtime_capture_strong)/i.test(
				w,
			),
		);
	if (!reverseReady) return filled;
	const pending = new Set(pendingCheckpointNames());
	if (pending.size === 0) return filled;
	syncSoftFill(pending, missionTarget(), filled);
	return filled;
}

export async function softFillOptionalOrchestrationWhenReverseReadyAsync(
	audit: { ready?: boolean; warnings?: string[] },
	_pi?: ExtensionAPI,
): Promise<string[]> {
	const filled = softFillOptionalOrchestrationWhenReverseReady(audit);
	const pending = new Set(pendingCheckpointNames());
	const target = missionTarget();
	// Reuse-only for authz soft-fill: never start a live capture during re_complete.
	if (pending.has("web_authz_ready") && target && /^https?:\/\//i.test(target)) {
		try {
			const reused = tryReuseRecentWebAuthz(target);
			if (reused) {
				updateMissionCheckpoint("web_authz_ready", "done", reused);
				filled.push("web_authz_ready");
			}
		} catch {
			/* optional */
		}
	}
	return filled;
}
