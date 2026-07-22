/** Lane run mission checkpoint updates from evidence quality. */
import { applyLaneCheckpointCompletions, significantLaneFindings } from "./helpers.ts";

export function applyLaneRunMissionCheckpoints(params: {
	checkpoints: any[];
	pack: any;
	critic: any;
	analysis: any;
	result: { code: number };
	followups: string[];
	timestamp: string;
}): any[] {
	let checkpoints = params.checkpoints;
	if (params.result.code === 0 && params.critic.score >= 45 && significantLaneFindings(params.analysis)) {
		checkpoints = applyLaneCheckpointCompletions(checkpoints, params.pack.lane);
	}
	if (params.followups.length > 0) {
		checkpoints = checkpoints.map((checkpoint: any) =>
			checkpoint.name === "repro_commands_ready"
				? {
						...checkpoint,
						status: "done" as const,
						note: `auto-followups:${params.pack.lane}`,
						updatedAt: params.timestamp,
					}
				: checkpoint,
		);
	}
	if (params.critic.verdict === "weak") {
		checkpoints = checkpoints.map((checkpoint: any) =>
			checkpoint.name === "minimal_path_proven" && checkpoint.status === "pending"
				? {
						...checkpoint,
						status: "blocked" as const,
						note: `evidence_quality=${params.critic.score}; self-heal queued:${params.pack.lane}`,
						updatedAt: params.timestamp,
					}
				: checkpoint,
		);
	}
	return checkpoints;
}
