/** Lane command pack domain-specific command seeds. */

import { appendLaneDomainNativeCommands } from "./pack-domain-native.ts";
import { appendLaneDomainPwnReverseCommands } from "./pack-domain-pwn.ts";
import type { LaneDomainPackCtx } from "./pack-domain-types.ts";
import { appendLaneDomainWebCommands } from "./pack-domain-web.ts";

export type { LaneDomainPackCtx } from "./pack-domain-types.ts";

export function appendLaneDomainCommands(ctx: LaneDomainPackCtx): void {
	appendLaneDomainNativeCommands(ctx);
	appendLaneDomainWebCommands(ctx);
	appendLaneDomainPwnReverseCommands(ctx);
}
