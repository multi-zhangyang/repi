/**
 * Tool index digest + bootstrap plan helpers.
 * Implementation under ./tool-index/*.
 */

export {
	bootstrapCatalogFor,
	bootstrapPlanForCommandPack,
	buildToolDigest,
	commandKnownTools,
	createBootstrapPlan,
	ensureToolIndexMaterialized,
	fallbackForMissingTools,
	formatBootstrapPlan,
	knownReconTool,
	missingToolsForCommand,
	parseToolIndex,
	replacementIfToolsAvailable,
	targetArgForPack,
	toolsFromCommand,
} from "./tool-index/catalog.ts";
export {
	configureToolIndex,
	configureToolIndexInstall,
	d,
} from "./tool-index/deps.ts";
export {
	installBootstrapTools,
	refreshToolIndex,
} from "./tool-index/install.ts";
export { recommendedToolsForRoute } from "./tool-index/route.ts";
export type {
	BootstrapCatalogEntry,
	BootstrapPlan,
	ToolIndexInstallDeps,
} from "./tool-index/types.ts";
