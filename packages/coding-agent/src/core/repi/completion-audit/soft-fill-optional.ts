/** Soft-fill optional reverse orchestration when runtime proof is already ready. */
import type { ExtensionAPI } from "../../extensions/types.ts";
import { buildAttackGraphOutput } from "../attack-graph.ts";
import { buildCompilerOutput } from "../compiler-runtime/build-core-format.ts";
import { latestContextPackArtifactPath, parseContextPackArtifact, writeContextPackArtifact } from "../context-pack.ts";
import { buildDecisionCoreOutput } from "../decision-runtime/build-run.ts";
import { buildKernelOutput } from "../kernel-runtime/artifact-output.ts";
import { readCurrentMission } from "../mission.ts";
import { buildOperatorOutput } from "../operator-runtime/core-write.ts";
import { buildReplayerOutput } from "../replayer-runtime/io.ts";
import { runWebAuthzState } from "../reverse-io/authz-run-core.ts";
import { buildVerifierOutput } from "../verifier-runtime/build-core-io.ts";
import { writeReportScaffold } from "./write-artifacts.ts";

function pendingCheckpointNames(): string[] {
	return (
		readCurrentMission()
			?.checkpoints?.filter((checkpoint: { status?: string; name?: string }) => checkpoint.status !== "done")
			.map((checkpoint) => String(checkpoint.name)) ?? []
	);
}

function closeOpenContextPackIfReverseReady(filled: string[]): void {
	try {
		const contextPath = latestContextPackArtifactPath();
		if (!contextPath) return;
		const pack = parseContextPackArtifact(contextPath);
		if (!pack || pack.mode === "resume" || pack.resumedFromContextPath) return;
		if (pack.closure?.status !== "open") return;
		pack.closure = {
			...(pack.closure ?? {}),
			status: "closed",
			closedAt: new Date().toISOString(),
			reason: "soft-fill: reverse proof ready",
		};
		if (pack.resumeContract?.closure) {
			pack.resumeContract.closure = pack.closure;
		}
		writeContextPackArtifact(pack);
		filled.push("context_pack_closed");
	} catch {
		/* optional */
	}
}

function missionTarget(): string | undefined {
	const mission = readCurrentMission();
	const task = String(mission?.task ?? "");
	return /https?:\/\/\S+/i.exec(task)?.[0];
}

function syncSoftFill(pending: Set<string>, target: string | undefined, filled: string[]): void {
	const tryFill = (name: string, run: () => void) => {
		if (!pending.has(name)) return;
		try {
			run();
			filled.push(name);
		} catch {
			/* optional */
		}
	};
	tryFill("execution_kernel_ready", () => {
		buildKernelOutput("build", { target });
	});
	tryFill("decision_core_ready", () => {
		buildDecisionCoreOutput("plan", { target });
	});
	tryFill("attack_graph_ready", () => {
		buildAttackGraphOutput("build");
	});
	tryFill("operation_queue_ready", () => {
		buildOperatorOutput("plan", { target });
	});
	tryFill("operator_queue_ready", () => {
		buildOperatorOutput("plan", { target });
	});
	tryFill("verifier_matrix_ready", () => {
		buildVerifierOutput("matrix", { target });
	});
	tryFill("compiler_ready", () => {
		buildCompilerOutput("draft", { target });
	});
	tryFill("replay_ready", () => {
		buildReplayerOutput("plan", { target });
	});
	tryFill("report_or_writeup_ready", () => {
		writeReportScaffold(target ? "web-api" : "repi-report");
	});
}

/**
 * When reverse runtime proof is ready, fill cheap optional orchestration artifacts
 * so models do not leave kernel/decision/graph/operator/verifier/replay/report pending.
 * Failures are ignored — never block re_complete audit.
 */
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
	closeOpenContextPackIfReverseReady(filled);
	return filled;
}

/** Async soft-fill including optional web-authz host capture when pi is available. */
export async function softFillOptionalOrchestrationWhenReverseReadyAsync(
	audit: { ready?: boolean; warnings?: string[] },
	pi?: ExtensionAPI,
): Promise<string[]> {
	const filled = softFillOptionalOrchestrationWhenReverseReady(audit);
	// softFill already closed open context packs when reverse ready
	const pending = new Set(pendingCheckpointNames());
	const target = missionTarget();
	if (pi && pending.has("web_authz_ready") && target && /^https?:\/\//i.test(target)) {
		try {
			await runWebAuthzState(pi as any, { url: target, timeoutMs: 20000 });
			filled.push("web_authz_ready");
		} catch {
			/* optional */
		}
	}
	return filled;
}
