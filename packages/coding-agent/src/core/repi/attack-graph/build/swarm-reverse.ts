/** Attack-graph swarm reverse gap seeding. */

import { reverseDomainCaptureNextCommands } from "../../reverse-capture.ts";
import type { AttackGraphBuildCtx } from "./ctx.ts";

export function appendAttackGraphSwarmReverseGaps(ctx: AttackGraphBuildCtx, swarm: any): void {
	const reverseBlob = JSON.stringify({
		workers: swarm?.workers ?? [],
		blocked: swarm?.blocked ?? [],
		handoffErrors: [
			...(swarm?.workerRetryHandoffClosureErrors ?? []),
			...(swarm?.workerRetryHandoffMergeSummaryErrors ?? []),
		],
	});
	if (
		!/native|pwn|malware|firmware|reverse|binary|exploit|mobile|js|browser|authz|web|proof_exit|bind_ready|frida|handoff/i.test(
			reverseBlob,
		)
	) {
		return;
	}
	for (const cmd of reverseDomainCaptureNextCommands({
		routeOrBlob: reverseBlob,
		target: swarm?.target,
		includeGates: true,
	}).slice(0, 2)) {
		ctx.gaps.push(`reverse_next: ${cmd}`);
	}
}
