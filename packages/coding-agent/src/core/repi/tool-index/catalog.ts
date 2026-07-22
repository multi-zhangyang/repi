/** Tool-index catalog/bootstrap pure helpers. */
export {
	bootstrapCatalogFor,
	buildToolDigest,
	createBootstrapPlan,
	ensureToolIndexMaterialized,
	formatBootstrapPlan,
	parseToolIndex,
} from "./catalog-core.ts";
export {
	bootstrapPlanForCommandPack,
	fallbackForMissingTools,
} from "./catalog-fallback.ts";
export {
	commandKnownTools,
	knownReconTool,
	missingToolsForCommand,
	replacementIfToolsAvailable,
	targetArgForPack,
	toolsFromCommand,
} from "./catalog-tools.ts";
