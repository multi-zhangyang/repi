/** Harness modes handle types. */
import type { ExtensionContext } from "../../../extensions/types.ts";
import type { RepiHarnessModeState, RepiPermissionMode } from "./types.ts";

export type RepiHarnessModesHandle = {
	getState: () => RepiHarnessModeState;
	setPermissionMode: (mode: RepiPermissionMode) => void;
	activateForRoute: (domain: string, ctx?: ExtensionContext) => string[];
	startupPacketLines: () => string[];
};

export let repiHarnessModesHandle: RepiHarnessModesHandle | null = null;

export function setRepiHarnessModesHandle(handle: RepiHarnessModesHandle | null): void {
	repiHarnessModesHandle = handle;
}
