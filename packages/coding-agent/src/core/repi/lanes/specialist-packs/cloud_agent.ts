/** Specialist pack handlers: cloud/identity/agent. */

import { applyWantsAgentSecurityAdvanced } from "./cloud_agent-advanced.ts";
import { applyWantsAgentSecurityBasic } from "./cloud_agent-basic.ts";
import type { SpecialistPackContext } from "./types.ts";

export function applyWantsAgentSecurity(ctx: SpecialistPackContext): void {
	applyWantsAgentSecurityBasic(ctx);
	applyWantsAgentSecurityAdvanced(ctx);
}
