/**
 * Pure reverse proof-capture helpers (catalog vs runtime capture).
 * No I/O — used by reverse-runtime, web-runtime, reverse-io, completion.
 * Implementation under ./reverse-capture/*.
 */

export { reverseAdapterCaptureProofFields } from "./reverse-capture/adapter-scoring.ts";
export {
	reverseStructuredProofFields,
	reverseTechniqueCaptureBind,
} from "./reverse-capture/catalog.ts";
export { reverseDomainCaptureNextCommands } from "./reverse-capture/next-commands.ts";
export { reverseProofGateLines } from "./reverse-capture/next-commands-gates.ts";
export { reverseRuntimeCaptureProofFields } from "./reverse-capture/runtime-scoring.ts";
