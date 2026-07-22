/**
 * Context pack builders, index, and resume helpers.
 * Implementation under ./context-pack/*.
 */

export {
	buildContextOutput,
	buildContextPack,
	buildExactResumeContextPack,
	writeContextPackArtifact,
} from "./context-pack/build.ts";
export { configureContextPack, d } from "./context-pack/deps.ts";
export {
	buildContextDigest,
	commandTargetSuffix,
	contextArtifactEntry,
	contextArtifactHashes,
	contextArtifactIndex,
	contextPackArtifactPathFor,
	contextPackHashPayload,
	contextPackReferenceMatches,
	contextPackSha256,
	contextRefLooksExplicit,
	contextSourceCommand,
	latestContextPackArtifactPath,
	latestOrBuildContextPack,
	memoryPath,
	parseContextPackArtifact,
	resolveContextPackPathByRef,
	scopedContextArtifactIndex,
} from "./context-pack/index.ts";
export type {
	ContextArtifactIndexEntry,
	ContextPackArtifact,
	ContextPackDeps,
	ContextResumeVerification,
} from "./context-pack/types.ts";
