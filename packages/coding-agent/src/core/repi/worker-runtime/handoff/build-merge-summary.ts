/** Worker handoff merge summary final bag. */
import { workerHandoffReverseNext } from "./build-merge-reverse.ts";

export function finalizeWorkerRetryHandoffMergeSummary(params: { base: any; workers: any[]; swarm?: any }): any {
	const reverseNext = workerHandoffReverseNext(params as any);
	return {
		...params.base,
		workers: params.workers,
		reverseNext,
		nextActions: Array.from(new Set([...(params.base.nextActions ?? []), ...reverseNext])).slice(0, 16),
	};
}
