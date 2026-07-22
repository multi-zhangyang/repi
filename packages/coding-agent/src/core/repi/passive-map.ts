/**
 * Passive target/workspace mapper for REPI reverse/pentest execution.
 * Produces map artifacts + signal lists before specialist lanes run.
 */
export type {
	PassiveMapExecResult,
	PassiveMapSideEffects,
} from "./passive-map-pure.ts";
export {
	passiveMapReverseNextCommands,
	passiveMapScript,
	passiveMapSignals,
	writePassiveMapArtifact,
} from "./passive-map-pure.ts";
export type { PassiveMapContext } from "./passive-map-runtime.ts";
export {
	inferTargetFromMap,
	latestPassiveMapContext,
	mapTargetUsable,
	runPassiveMap,
} from "./passive-map-runtime.ts";
