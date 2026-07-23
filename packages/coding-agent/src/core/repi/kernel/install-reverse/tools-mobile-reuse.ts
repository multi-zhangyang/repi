/** Same-target mobile runtime artifact reuse within TTL. */
import { existsSync, readFileSync, statSync } from "node:fs";

export function tryReuseRecentMobileRuntimeArtifact(params: {
	target?: string;
	packageName?: string;
	latestPath?: string;
	ttlMs?: number;
}): { path: string; ageMs: number; body: string } | undefined {
	const latest = params.latestPath;
	if (!latest || !existsSync(latest)) return undefined;
	const ageMs = Date.now() - statSync(latest).mtimeMs;
	const ttl = params.ttlMs ?? 120_000;
	if (ageMs < 0 || ageMs >= ttl) return undefined;
	const body = readFileSync(latest, "utf8");
	const target = String(params.target ?? "").trim() || ".";
	const pkg = String(params.packageName ?? "").trim();
	const sameTarget =
		body.includes(`target: ${target}`) ||
		body.includes(`target=${target}`) ||
		(target === "." && (/target:\s*\.|target=\./.test(body) || /mode:\s*run/.test(body))) ||
		(pkg ? body.includes(pkg) : false);
	const hasProof =
		/proof\.exit=(partial_runtime_capture|runtime_capture_strong)|bind_ready=true|mobile_runtime_artifact:/i.test(
			body,
		);
	if (!sameTarget || !hasProof) return undefined;
	return { path: latest, ageMs, body };
}
