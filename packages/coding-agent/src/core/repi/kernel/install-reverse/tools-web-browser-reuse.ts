/** Same-URL live browser artifact reuse within TTL. */
import { existsSync, readFileSync, statSync } from "node:fs";

export function tryReuseRecentLiveBrowserArtifact(params: {
	url: string;
	latestPath?: string;
	ttlMs?: number;
}): { path: string; ageMs: number; body: string } | undefined {
	const latest = params.latestPath;
	if (!latest || !existsSync(latest)) return undefined;
	const ageMs = Date.now() - statSync(latest).mtimeMs;
	const ttl = params.ttlMs ?? 120_000;
	if (ageMs < 0 || ageMs >= ttl) return undefined;
	const body = readFileSync(latest, "utf8");
	const url = params.url;
	const sameUrl =
		body.includes(url) ||
		body.includes(url.replace(/^https?:\/\//i, "")) ||
		latest.includes(url.replace(/[^a-z0-9.-]+/gi, "-").slice(0, 40));
	const hasProof = /proof\.exit=(partial_runtime_capture|runtime_capture_strong)/i.test(body);
	if (!sameUrl || !hasProof) return undefined;
	return { path: latest, ageMs, body };
}
