/** Compaction resume telemetry update from executions/operator. */

import { updateReconCompactionTelemetryFromExecutions } from "./telemetry-update-exec.ts";
import type { ReconCompactionResumeTelemetry } from "./types.ts";

export { updateReconCompactionTelemetryFromExecutions } from "./telemetry-update-exec.ts";

type OperatorArtifact = any;

export function updateReconCompactionTelemetryFromOperator(
	operator: OperatorArtifact,
): ReconCompactionResumeTelemetry | undefined {
	return updateReconCompactionTelemetryFromExecutions(
		operator.executed,
		[operator.contextArtifact].filter(Boolean) as string[],
	);
}
