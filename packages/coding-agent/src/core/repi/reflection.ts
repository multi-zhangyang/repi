/** Reflection runtime facade. */

export { buildReflection, formatReflection } from "./reflection/build.ts";
export { buildReflectOutput, writeReflectionArtifact } from "./reflection/output.ts";
export type { ReflectionArtifact, ReflectionDeps } from "./reflection/types-config.ts";
export {
	configureReflection,
	latestReflectionArtifactPath,
	parseReflectionArtifact,
} from "./reflection/types-config.ts";
