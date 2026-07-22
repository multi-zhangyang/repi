/** Lane-level autonomous budget demotion rows. */

import { activeLane, commandTargetSuffix, readCurrentMission } from "./deps.ts";
import type { AutonomousBudgetLedgerSnapshot } from "./types.ts";

export function autonomousLaneDemotionRows(params: {
	dispatcherDemotions: string[];
	workerDemotions: string[];
	ledger: AutonomousBudgetLedgerSnapshot;
	target?: string;
}): string[] {
	const mission = readCurrentMission();
	const active = mission ? activeLane(mission) : undefined;
	if (!mission || !active) return [];
	if (active.name === "autonomous-dispatcher-repair") return [];
	const pressure =
		params.dispatcherDemotions.length + params.workerDemotions.length + params.ledger.laneDemotions.length;
	const repeatedDispatcher = params.ledger.dispatcherDemotions.length + params.dispatcherDemotions.length;
	const repeatedWorker = params.ledger.workerDemotions.length + params.workerDemotions.length;
	if (pressure < 3 && repeatedDispatcher < 3 && repeatedWorker < 3) return [];
	const suffix = commandTargetSuffix(params.target ?? mission.task);
	return [
		[
			"demote_lane autonomous_budget",
			`active=${active.name}`,
			`pressure=${pressure}`,
			`dispatcher_repeats=${repeatedDispatcher}`,
			`worker_repeats=${repeatedWorker}`,
			"target_lane=autonomous-dispatcher-repair",
			`-> re_lane plan autonomous-dispatcher-repair${suffix} && re_operator dispatch${suffix} 1 && re_proof_loop run${suffix} 4 2`,
		].join(" "),
	];
}
