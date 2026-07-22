/** REPI wire bus slice: lane-modules. */

import { wireAutoLaneConfigure } from "./wire-lane-auto.ts";
import { wireCampaignRuntimeConfigure } from "./wire-lane-campaign.ts";
import { wireCaseMemoryConfigure } from "./wire-lane-case-memory.ts";
import { wireLaneCommandsConfigure } from "./wire-lane-commands.ts";
import { wireMemoryUxConfigure } from "./wire-lane-memory-ux.ts";
import { wirePlaybooksConfigure } from "./wire-lane-playbooks.ts";
import { wireProfileCheckConfigure } from "./wire-lane-profile-check.ts";
import { wireLaneRunMissionConfigure } from "./wire-lane-run-mission.ts";
import { wireToolIndexInstallConfigure } from "./wire-lane-tool-index.ts";
import type { PickFn } from "./wire-pick.ts";

export function wireLaneModules(pick: PickFn): void {
	wireLaneCommandsConfigure(pick);
	wireLaneRunMissionConfigure(pick);
	wireAutoLaneConfigure(pick);
	wireCampaignRuntimeConfigure(pick);
	wireCaseMemoryConfigure(pick);
	wirePlaybooksConfigure(pick);
	wireProfileCheckConfigure(pick);
	wireToolIndexInstallConfigure(pick);
	wireMemoryUxConfigure(pick);
}
