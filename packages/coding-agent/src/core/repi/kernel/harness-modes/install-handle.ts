/** Harness modes handle accessor. */
import type { RepiHarnessModesHandle } from "./install-types.ts";
import { repiHarnessModesHandle } from "./install-types.ts";

export function getRepiHarnessModesHandle(): RepiHarnessModesHandle | null {
	return repiHarnessModesHandle;
}
