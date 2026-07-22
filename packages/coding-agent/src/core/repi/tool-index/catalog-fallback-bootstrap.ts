/** Bootstrap plan for command packs via autopilot. */
import { autopilotBootstrapPlan } from "../autopilot.ts";
import type { LaneCommandPack } from "../lane-commands/types.ts";
import type { BootstrapPlan } from "./types.ts";

export function bootstrapPlanForCommandPack(pack: LaneCommandPack): BootstrapPlan[] {
	return autopilotBootstrapPlan({ domain: pack.route, intent: "", toolchain: "", skillHint: "", workflow: [] }, pack);
}
