/**
 * Runtime adapter surface for REPI reverse runners.
 * Implementation split under ./runtime-adapter/*.
 */

export {
	buildRuntimeAdapterExecutionGate,
	formatRuntimeAdapterExecutionGate,
	runtimeAdapterSecretLike,
} from "./runtime-adapter/gate.ts";
export { RUNTIME_ADAPTER_EXECUTION_MATRIX } from "./runtime-adapter/matrix.ts";
export {
	formatRuntimeAdapterExecutionArtifact,
	materializeRuntimeAdapterCommand,
	parseRuntimeAdapterSignals,
	summarizeRuntimeAdapterSignals,
} from "./runtime-adapter/signals.ts";
export {
	detectRuntimeAdapterIds,
	inspectRuntimeAdapterTarget,
} from "./runtime-adapter/target-inspect.ts";
export type {
	RuntimeAdapterExecutionArtifactV1,
	RuntimeAdapterExecutionCheckV1,
	RuntimeAdapterExecutionRowV1,
	RuntimeAdapterExecutionSpec,
	RuntimeAdapterParserRuleV1,
	RuntimeAdapterParserSignalSummaryV1,
	RuntimeAdapterRunnerKind,
	RuntimeAdapterStatus,
	RuntimeAdapterTargetKind,
	RuntimeAdapterTargetProfileV1,
	RuntimeAdapterTargetSignalV1,
	RuntimeAdapterToolPresence,
} from "./runtime-adapter/types.ts";
