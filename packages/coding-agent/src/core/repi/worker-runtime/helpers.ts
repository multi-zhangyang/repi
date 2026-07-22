/**
 * Shared worker-runtime pure helpers.
 */
export function stableJson(value: unknown): string {
	return JSON.stringify(value, (_key, item) => {
		if (!item || typeof item !== "object" || Array.isArray(item)) return item;
		return Object.keys(item as Record<string, unknown>)
			.sort()
			.reduce<Record<string, unknown>>((out, key) => {
				out[key] = (item as Record<string, unknown>)[key];
				return out;
			}, {});
	});
}

export function sameStringSet(left: readonly string[], right: readonly string[]): boolean {
	const leftSet = new Set(left);
	const rightSet = new Set(right);
	if (leftSet.size !== rightSet.size) return false;
	for (const item of leftSet) {
		if (!rightSet.has(item)) return false;
	}
	return true;
}

export function envRefName(ref: string): string | undefined {
	const match = /^\$([A-Z_][A-Z0-9_]*)$/.exec(ref.trim());
	return match?.[1];
}

// WorkerRuntimePoolV1 split contract: runtime:worker-runtime-pool-validation runtime:claim-aware-worker-merge runtime:child-session-runtime-bridge.
