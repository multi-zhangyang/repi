/** Runtime adapter execution capture + reverse proof footer. */

import { appendRuntimeAdapterCaptureEvidence } from "./runtime-adapter-exec-run-capture-reverse.ts";
import { writeRuntimeAdapterExecutionArtifact } from "./runtime-adapter-exec-run-capture-write.ts";

export function captureRuntimeAdapterExecution(params: {
	adapter: any;
	selectedRunner: "native" | "fallback";
	command: string;
	target: string;
	startedAt: string;
	finishedAt: string;
	result: { code: number; stdout: string; stderr: string; killed?: boolean };
}): string {
	const { artifact, path } = writeRuntimeAdapterExecutionArtifact(params);
	return appendRuntimeAdapterCaptureEvidence({
		adapter: params.adapter,
		selectedRunner: params.selectedRunner,
		target: params.target,
		result: params.result,
		artifact,
		path,
	});
}
