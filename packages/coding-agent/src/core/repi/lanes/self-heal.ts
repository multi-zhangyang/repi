/**
 * Lane self-heal command generation from failed evidence/runtime output.
 * Implementation under ./self-heal/*.
 */

export {
	commandKnownTools,
	configureSelfHealToolResolvers,
	dedupeLaneCommands,
	packHasSpecialistSignal,
	pythonString,
	toolRepairMatrixScript,
	transcriptRepairItems,
} from "./self-heal/helpers.ts";
export { selfHealCommandsForEvidence } from "./self-heal/main.ts";
export type {
	LaneCommandPack,
	SelfHealToolResolvers,
} from "./self-heal/types.ts";
