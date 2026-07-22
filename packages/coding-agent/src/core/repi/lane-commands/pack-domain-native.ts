/** Lane pack domain: native/android/runtime seeds. */

import { appendLaneDomainNativeControl } from "./pack-domain-native-control.ts";
import { appendLaneDomainNativeRuntime } from "./pack-domain-native-runtime.ts";
import { appendLaneDomainNativeTriage } from "./pack-domain-native-triage.ts";
import type { LaneDomainPackCtx } from "./pack-domain-types.ts";

export function appendLaneDomainNativeCommands(ctx: LaneDomainPackCtx): void {
	appendLaneDomainNativeTriage(ctx);
	appendLaneDomainNativeControl(ctx);
	appendLaneDomainNativeRuntime(ctx);
}
