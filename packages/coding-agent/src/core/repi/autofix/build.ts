/** Autofix build/write/output facade. */

export { buildAutofix } from "./build-core.ts";
export {
	autofixItem,
	bootstrapToolFromCommand,
	latestAutofixArtifactPath,
	latestOrBuildReplay,
	parseAutofixArtifact,
	replayFailureRows,
} from "./helpers.ts";
export { buildAutofixOutput } from "./output.ts";
export { writeAutofixArtifact, writeAutofixRepairRollbackPolicy } from "./write.ts";
