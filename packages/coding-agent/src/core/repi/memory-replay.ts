/** Legacy `memory-replay.ts` surface — product memory removed; test/historical stubs. */

export type MemoryReplayEvaluatorRowV12 = any;
export function memoryReplayEvaluatorRowHash(..._args: any[]): string {
	return "0".repeat(64);
}
export function readMemoryReplayEvaluatorRows(..._args: any[]): any[] {
	return [];
}
export function buildMemoryReplayEvaluatorReport(..._args: any[]): any {
	return { rows: [], wrote: false };
}
