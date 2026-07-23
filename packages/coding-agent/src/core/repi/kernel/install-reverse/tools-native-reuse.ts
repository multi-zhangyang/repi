/** Same-target native runtime artifact reuse within TTL. */
import { existsSync, readFileSync, statSync } from "node:fs";

export function tryReuseRecentNativeRuntimeArtifact(params: {
	target?: string;
	latestPath?: string;
	ttlMs?: number;
}): { path: string; ageMs: number; body: string } | undefined {
	const latest = params.latestPath;
	if (!latest || !existsSync(latest)) return undefined;
	const ageMs = Date.now() - statSync(latest).mtimeMs;
	const ttl = params.ttlMs ?? 120_000;
	if (ageMs < 0 || ageMs >= ttl) return undefined;
	const body = readFileSync(latest, "utf8");
	const target = String(params.target ?? "").trim();
	if (!target) return undefined;
	const sameTarget =
		body.includes(`target: ${target}`) ||
		body.includes(`target=${target}`) ||
		body.includes(target) ||
		latest.includes(target.replace(/[^a-z0-9._+-]+/gi, "-").slice(0, 48));
	const hasProof =
		/proof\.exit=(partial_runtime_capture|runtime_capture_strong)|bind_ready=true|native_runtime_artifact:/i.test(
			body,
		);
	if (!sameTarget || !hasProof) return undefined;
	return { path: latest, ageMs, body };
}

const inflight = new Map<string, Promise<string>>();

export function nativeRunKey(target?: string): string {
	return String(target ?? "").trim() || ".";
}

/** Coalesce concurrent same-target native runs onto one execution promise. */
export async function runNativeRuntimeCoalesced(params: {
	target?: string;
	run: () => Promise<string>;
}): Promise<{ text: string; coalesced: boolean }> {
	const key = nativeRunKey(params.target);
	const existing = inflight.get(key);
	if (existing) {
		const text = await existing;
		return { text, coalesced: true };
	}
	const pending = params.run().finally(() => {
		if (inflight.get(key) === pending) inflight.delete(key);
	});
	inflight.set(key, pending);
	const text = await pending;
	return { text, coalesced: false };
}
