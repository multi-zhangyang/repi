/**
 * Autofix planning/apply/repair helpers.
 * Implementation under ./autofix/*.
 */

export {
	autofixItem,
	bootstrapToolFromCommand,
	buildAutofix,
	buildAutofixOutput,
	latestAutofixArtifactPath,
	latestOrBuildReplay,
	parseAutofixArtifact,
	replayFailureRows,
	writeAutofixArtifact,
	writeAutofixRepairRollbackPolicy,
} from "./autofix/build.ts";
export { configureAutofix, d } from "./autofix/deps.ts";
export type {
	AutofixArtifact,
	AutofixDeps,
	AutofixItem,
	AutofixItemKind,
	AutofixReplayView,
	AutofixStatus,
} from "./autofix/types.ts";
