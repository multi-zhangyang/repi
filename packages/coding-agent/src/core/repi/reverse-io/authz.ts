/** Reverse I/O domain: authz facade. */
export {
	buildWebAuthzStateArtifact,
	inferWebAuthzUrl,
	latestWebAuthzStateArtifactPath,
} from "./authz-pure.ts";
export {
	buildWebAuthzStateOutput,
	runWebAuthzState,
	writeWebAuthzStateArtifact,
} from "./authz-run.ts";
