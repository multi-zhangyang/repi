import type { RoutePlan } from "./profile-runtime.ts";
/** REPI recon extension stats. */
export type ReconStats = {
	calls: number;
	bashCalls: number;
	failures: number;
	lastCommandHash?: string;
	repeatedCommandCount: number;
	lastCommands: string[];
	active: boolean;
	selfReviewDue: boolean;
	selfReviewNotified?: boolean;
	lastRoute?: RoutePlan;
	currentMissionId?: string;
	sessionFile?: string;
	noSession?: boolean;
};

export function createInitialReconStats(): ReconStats {
	return {
		calls: 0,
		bashCalls: 0,
		failures: 0,
		repeatedCommandCount: 0,
		lastCommands: [],
		active: false,
		selfReviewDue: false,
		selfReviewNotified: false,
	};
}
