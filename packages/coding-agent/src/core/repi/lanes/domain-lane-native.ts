/** Domain lane commands: native/android/runtime seeds. */

import { appendDomainLaneNativeControl } from "./domain-lane-native-control.ts";
import { appendDomainLaneNativeRuntime } from "./domain-lane-native-runtime.ts";
import { appendDomainLaneNativeTriage } from "./domain-lane-native-triage.ts";
import type { DomainLaneRuntimeCtx } from "./domain-lane-types.ts";

export function appendDomainLaneNativeCommands(
	ctx: DomainLaneRuntimeCtx,
	add: (label: string, command: string, evidence: string) => void,
): void {
	appendDomainLaneNativeTriage(ctx, add);
	appendDomainLaneNativeControl(ctx, add);
	appendDomainLaneNativeRuntime(ctx, add);
}
