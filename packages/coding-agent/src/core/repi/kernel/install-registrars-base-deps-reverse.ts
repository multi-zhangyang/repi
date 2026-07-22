/** Install base deps: reverse-io / proof / domain runtime slice. */
import { installBaseReverseIoDeps } from "./install-registrars-base-deps-reverse-io.ts";
import { installBaseReverseLoopDeps } from "./install-registrars-base-deps-reverse-loop.ts";

export const installBaseReverseDeps = {
	...installBaseReverseIoDeps,
	...installBaseReverseLoopDeps,
} as const;
