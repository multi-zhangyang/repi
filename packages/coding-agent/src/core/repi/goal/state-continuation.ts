/** Goal continuation markers / tracking */
import { randomUUID } from "node:crypto";
import { escapeRegExpText } from "./format.ts";
import type { RepiGoalRuntime, RepiGoalState } from "./types.ts";
import { CONTINUATION_MARKER_PREFIX, MAX_CANCELLED_CONTINUATION_PROMPTS } from "./types.ts";

export function clearContinuationTracking(runtime: RepiGoalRuntime): void {
	runtime.continuationPending = undefined;
	runtime.cancelledContinuationMarkers.clear();
}

export function cancelContinuationPending(runtime: RepiGoalRuntime): void {
	if (runtime.continuationPending) rememberCancelledContinuationMarker(runtime, runtime.continuationPending.marker);
	runtime.continuationPending = undefined;
}

export function rememberCancelledContinuationMarker(runtime: RepiGoalRuntime, marker: string): void {
	runtime.cancelledContinuationMarkers.add(marker);
	if (runtime.cancelledContinuationMarkers.size <= MAX_CANCELLED_CONTINUATION_PROMPTS) return;
	const oldest = runtime.cancelledContinuationMarkers.values().next().value;
	if (oldest) runtime.cancelledContinuationMarkers.delete(oldest);
}

export function consumeCancelledContinuationPrompt(runtime: RepiGoalRuntime, prompt: string): boolean {
	const marker = extractContinuationMarker(prompt);
	return marker ? runtime.cancelledContinuationMarkers.delete(marker) : false;
}

export function markContinuationDelivered(runtime: RepiGoalRuntime, prompt: string): void {
	const marker = extractContinuationMarker(prompt);
	if (marker && runtime.continuationPending?.marker === marker) runtime.continuationPending = undefined;
}

export function continuationMarker(goal: RepiGoalState): string {
	return `${goal.id}:${goal.iteration}:${randomUUID()}`;
}

export function continuationMarkerComment(marker: string): string {
	return `<!-- ${CONTINUATION_MARKER_PREFIX}${marker} -->`;
}

export function extractContinuationMarker(prompt: string): string | undefined {
	const pattern = new RegExp(`<!--\\s*${escapeRegExpText(CONTINUATION_MARKER_PREFIX)}([^\\s>]+)\\s*-->`);
	return pattern.exec(prompt)?.[1];
}
