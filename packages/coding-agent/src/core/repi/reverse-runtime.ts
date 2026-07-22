/**
 * Native / mobile / exploit-lab pure helpers: scripts, anchors, formatters.
 * Runtime I/O (write/run/build artifacts) stays in reverse-io.
 * Domain implementations under ./reverse-runtime/*.
 */

export {
	exploitLabAnchors,
	exploitLabPlanMatrices,
	exploitLabRunnerScript,
	exploitLabShellCommand,
	exploitLabStructuredSummary,
	formatExploitLab,
} from "./reverse-runtime/exploit.ts";
export {
	formatMobileRuntime,
	mobileRuntimeAnchors,
	mobileRuntimeFridaHookScript,
	mobileRuntimePlanMatrices,
	mobileRuntimeShellCommand,
	mobileRuntimeStructuredSummary,
} from "./reverse-runtime/mobile.ts";
export {
	formatNativeRuntime,
	nativeRuntimeAnchors,
	nativeRuntimeGdbScript,
	nativeRuntimePlanMatrices,
	nativeRuntimePwntoolsScaffold,
	nativeRuntimeShellCommand,
	nativeRuntimeStructuredSummary,
} from "./reverse-runtime/native.ts";
export { repiRuntimeWorkdirShell } from "./reverse-runtime/shared.ts";
export type {
	ExploitLabArtifact,
	ExploitLabExecution,
	MobileRuntimeArtifact,
	MobileRuntimeExecution,
	NativeRuntimeArtifact,
	NativeRuntimeExecution,
} from "./reverse-runtime/types.ts";
