/** Failure signature priority report. */

import { runtimeFailureLedgerPath, runtimeRepairQueuePath } from "../storage.ts";
import { uniqueNonEmpty } from "../text.ts";
import { runtimeFailurePriority, runtimeFailureTargetMatches, runtimeRepairTargetMatches } from "./classify.ts";
import { readRuntimeFailureLedgerRows, readRuntimeRepairQueueRows } from "./ledger.ts";
import { failurePriorityReverseNextCommands } from "./report-priority-reverse.ts";

export function failureSignaturePriorityReport(target?: string): {
	rows: string[];
	commands: string[];
	repairQueue: string[];
	sourceArtifacts: string[];
	exhaustedCount: number;
	repeatedCount: number;
} {
	const failures = readRuntimeFailureLedgerRows().filter((failure: any) =>
		runtimeFailureTargetMatches(failure, target),
	);
	const failureIds = new Set(failures.map((failure: any) => failure.id));
	const failureSignatures = new Set(failures.map((failure: any) => failure.signature));
	const repairs = readRuntimeRepairQueueRows().filter(
		(repair) =>
			(!target || runtimeRepairTargetMatches(repair, target) || failureIds.has(repair.fromFailureId)) &&
			(!failureSignatures.size || failureSignatures.has(repair.signature)),
	);
	const repairBySignature = new Map<string, any>();
	for (const repair of repairs) {
		const existing = repairBySignature.get(repair.signature);
		if (
			!existing ||
			(existing.paused && !repair.paused) ||
			(repair.commands?.length ?? 0) > (existing.commands?.length ?? 0)
		)
			repairBySignature.set(repair.signature, repair);
	}
	const grouped = new Map<string, any[]>();
	for (const failure of failures) grouped.set(failure.signature, [...(grouped.get(failure.signature) ?? []), failure]);
	const latest = [...grouped.values()]
		.map(
			(rows: any) =>
				rows.sort((left: any, right: any) => right.attempt - left.attempt || right.ts.localeCompare(left.ts))[0]!,
		)
		.sort(
			(left, right) =>
				runtimeFailurePriority(right.status) - runtimeFailurePriority(left.status) ||
				right.attempt - left.attempt ||
				left.budget.remainingAttempts - right.budget.remainingAttempts ||
				right.ts.localeCompare(left.ts),
		);
	const rows = latest.slice(0, 16).map((failure: any) => {
		const repair = repairBySignature.get(failure.signature);
		const repeats = grouped.get(failure.signature)?.length ?? 1;
		const readyRepair = repair && !repair.paused && repair.commands.length > 0;
		const next = readyRepair ? repair.commands[0] : failure.budget.exhaustedAction;
		return [
			`failure_signature_priority status=${failure.status}`,
			`attempt=${failure.attempt}/${failure.maxAttempts}`,
			`repeats=${repeats}`,
			`remaining=${failure.budget.remainingAttempts}`,
			`signature=${failure.signature.slice(0, 16)}`,
			`source=${failure.source}`,
			`category=${failure.category}`,
			`repair_action=${readyRepair ? repair.action : "escalate"}`,
			`repair_ready=${readyRepair ? "true" : "false"}`,
			`failed_checks=${failure.failedChecks.join("|") || "none"}`,
			`next=${next}`,
		].join(" ");
	});
	const repairQueue = repairs
		.slice(0, 16)
		.map((repair: any) =>
			[
				`failure_signature_repair_queue repair_id=${repair.repairId}`,
				`signature=${repair.signature.slice(0, 16)}`,
				`action=${repair.action}`,
				`paused=${repair.paused}`,
				`ready=${!repair.paused && repair.commands.length > 0}`,
				`commands=${repair.commands.join(" && ") || "missing"}`,
				`expected_checks=${repair.expectedChecks.join("|") || "none"}`,
			].join(" "),
		);
	return {
		rows,
		commands: uniqueNonEmpty(
			[
				...failurePriorityReverseNextCommands(target, latest),
				...latest.flatMap((failure: any) => {
					const repair = repairBySignature.get(failure.signature);
					if (repair && !repair.paused && repair.commands.length) return repair.commands;
					return [failure.budget.exhaustedAction];
				}),
			],
			16,
		),
		repairQueue,
		sourceArtifacts: uniqueNonEmpty(
			[
				runtimeFailureLedgerPath(),
				runtimeRepairQueuePath(),
				...latest.flatMap((failure: any) => failure.artifactHashes.map((artifact: any) => artifact.path)),
			],
			32,
		),
		exhaustedCount: latest.filter((failure: any) => failure.status === "exhausted").length,
		repeatedCount: [...grouped.values()].filter((rows: any) => rows.length > 1).length,
	};
}
