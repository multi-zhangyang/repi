/** Reverse I/O domain: native facade. */
export {
	buildNativeRuntimeArtifact,
	inferNativeRuntimeTarget,
	latestNativeRuntimeArtifactPath,
} from "./native-pure.ts";
export {
	buildNativeRuntimeOutput,
	runNativeRuntime,
	writeNativeRuntimeArtifact,
} from "./native-run.ts";
