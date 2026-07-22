/** Same-target passive map artifact reuse within TTL. */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

function hostToken(target: string): string {
	try {
		const u = new URL(target);
		return u.hostname.replace(/[^a-z0-9.-]+/gi, "-").toLowerCase();
	} catch {
		return target
			.replace(/[^a-z0-9.-]+/gi, "-")
			.toLowerCase()
			.slice(0, 48);
	}
}

export function tryReuseRecentMapArtifact(params: {
	target?: string;
	mapsDir: string;
	ttlMs?: number;
}): { path: string; ageMs: number; body: string } | undefined {
	const target = String(params.target ?? "").trim();
	if (!target || !params.mapsDir || !existsSync(params.mapsDir)) return undefined;
	const ttl = params.ttlMs ?? 180_000;
	const token = hostToken(target);
	const files = readdirSync(params.mapsDir)
		.filter((name) => name.endsWith(".md"))
		.map((name) => {
			const path = join(params.mapsDir, name);
			return { path, m: statSync(path).mtimeMs, name };
		})
		.sort((a, b) => b.m - a.m)
		.slice(0, 12);
	const now = Date.now();
	for (const file of files) {
		const ageMs = now - file.m;
		if (ageMs < 0 || ageMs >= ttl) continue;
		if (token && !file.name.toLowerCase().includes(token.split(".")[0] ?? token) && !file.name.includes(token)) {
			// still allow body match below
		}
		const body = readFileSync(file.path, "utf8");
		const same =
			body.includes(`target=${target}`) ||
			body.includes(target) ||
			(token ? file.name.toLowerCase().includes(token.split(".")[0] ?? token) : false);
		const ok = /exit\s*[:=]\s*0|signals\s*[:=]\s*\d+/i.test(body);
		if (same && ok) return { path: file.path, ageMs, body };
	}
	return undefined;
}
