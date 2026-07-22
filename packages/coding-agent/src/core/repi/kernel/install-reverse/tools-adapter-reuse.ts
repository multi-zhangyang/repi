/** Same-adapter+target runtime adapter artifact reuse within TTL + in-flight coalesce. */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { evidenceToolchainDir } from "../../storage.ts";

const inflight = new Map<string, Promise<string>>();

export function adapterRunKey(adapterId?: string, target?: string): string {
	return `${String(adapterId ?? "").trim()}::${String(target ?? "").trim() || "."}`;
}

export function tryReuseRecentRuntimeAdapterArtifact(params: {
	adapterId?: string;
	target?: string;
	ttlMs?: number;
}): { path: string; ageMs: number; body: string; adapterId: string } | undefined {
	const adapterId = String(params.adapterId ?? "").trim();
	const target = String(params.target ?? "").trim() || ".";
	if (!adapterId) return undefined;
	const dir = join(evidenceToolchainDir(), "runtime-adapters", adapterId);
	if (!existsSync(dir)) return undefined;
	const files = readdirSync(dir)
		.filter((n) => n.endsWith(".json"))
		.map((n) => join(dir, n))
		.sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs);
	const latest = files[0];
	if (!latest) return undefined;
	const ageMs = Date.now() - statSync(latest).mtimeMs;
	const ttl = params.ttlMs ?? 120_000;
	if (ageMs < 0 || ageMs >= ttl) return undefined;
	let raw = "";
	try {
		raw = readFileSync(latest, "utf8");
	} catch {
		return undefined;
	}
	try {
		const j = JSON.parse(raw) as {
			target?: string;
			exitCode?: number;
			stdoutHead?: string;
			stderrHead?: string;
			proofExitSignals?: string[];
		};
		const artTarget = String(j.target ?? "").trim() || ".";
		const targetOk = artTarget === target || (target === "." && (artTarget === "." || artTarget === "./"));
		const head = `${j.stdoutHead ?? ""}\n${j.stderrHead ?? ""}\n${(j.proofExitSignals ?? []).join("\n")}`;
		const proofOk =
			j.exitCode === 0 && /proof\.exit=(partial_runtime_capture|runtime_capture_strong)|bind_ready=true/i.test(head);
		if (!targetOk || !proofOk) return undefined;
	} catch {
		return undefined;
	}
	return { path: latest, ageMs, body: raw, adapterId };
}

/** Coalesce concurrent same adapter+target runs onto one execution promise. */
export async function runRuntimeAdapterCoalesced(params: {
	adapterId?: string;
	target?: string;
	run: () => Promise<string>;
}): Promise<{ text: string; coalesced: boolean }> {
	const key = adapterRunKey(params.adapterId, params.target);
	const existing = inflight.get(key);
	if (existing) {
		const text = await existing;
		return { text, coalesced: true };
	}
	const pending = params.run().finally(() => {
		inflight.delete(key);
	});
	inflight.set(key, pending);
	const text = await pending;
	return { text, coalesced: false };
}
