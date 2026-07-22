/** Soft-fill: reuse recent web-authz artifacts for same URL. */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { evidenceWebAuthzDir } from "../storage.ts";

export function tryReuseRecentWebAuthz(target: string, ttlMs = 180_000): string | undefined {
	try {
		const dir = evidenceWebAuthzDir();
		if (!dir || !existsSync(dir)) return undefined;
		const host = (() => {
			try {
				return new URL(target).hostname.toLowerCase();
			} catch {
				return target.toLowerCase();
			}
		})();
		const token = host.split(".")[0] ?? host;
		const hostSlug = host.replace(/[^a-z0-9.-]/g, "-");
		const now = Date.now();
		const files = readdirSync(dir)
			.filter((n) => n.endsWith(".md"))
			.map((n) => {
				const path = join(dir, n);
				return { path, m: statSync(path).mtimeMs, n };
			})
			.sort((a, b) => b.m - a.m)
			.slice(0, 10);
		for (const f of files) {
			const age = now - f.m;
			if (age < 0 || age >= ttlMs) continue;
			if (!f.n.toLowerCase().includes(token) && !f.n.toLowerCase().includes(hostSlug)) continue;
			const body = readFileSync(f.path, "utf8");
			if (body.includes(target) || body.includes(host)) return f.path;
		}
	} catch {
		/* optional */
	}
	return undefined;
}
