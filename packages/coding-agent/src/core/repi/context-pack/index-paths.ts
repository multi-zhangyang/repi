/** Context-pack path/hash helpers. */
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { evidenceContextsDir } from "../storage.ts";
import { slug } from "../text.ts";
import type { ContextArtifactIndexEntry, ContextPackArtifact } from "./types.ts";

const CONTEXT_HASH_OMIT = new Set([
	"hash",
	"sha256",
	"contentHash",
	"artifactHash",
	"tipHash",
	"eventHash",
	"raw",
	"stdout",
	"stderr",
	// Self-referential / post-hash fields must not feed the digest.
	"contextSha256",
	"exactResumeVerification",
	"generatedAt",
	"timestamp",
]);

export function contextPackArtifactPathFor(params: {
	timestamp: string;
	route?: string;
	target?: string;
	mode: "pack" | "resume";
}): string {
	return join(
		evidenceContextsDir(),
		`${params.timestamp.replace(/[:.]/g, "-")}-${slug(params.route ?? params.target ?? "context")}-${params.mode}.md`,
	);
}

export function contextPackHashPayload(pack: ContextPackArtifact): unknown {
	const strip = (value: unknown): unknown => {
		if (Array.isArray(value)) return value.map(strip);
		if (value && typeof value === "object") {
			return Object.fromEntries(
				Object.entries(value as Record<string, unknown>)
					.filter(([key]) => !CONTEXT_HASH_OMIT.has(key))
					.map(([key, item]) => [key, strip(item)]),
			);
		}
		return value;
	};
	return strip(pack);
}

export function contextArtifactHashes(
	index: ContextArtifactIndexEntry[],
): Array<{ artifactId: string; path: string; sha256: string | null; required: boolean }> {
	return index.map((artifact: any) => ({
		artifactId: artifact.artifactId ?? `${artifact.kind}:${artifact.path}`,
		path: artifact.path,
		sha256: artifact.sha256 ?? null,
		required: artifact.required ?? artifact.exists === true,
	}));
}

export function contextPackReferenceMatches(pack: ContextPackArtifact, path: string, ref: string): boolean {
	return [
		path,
		pack.contextPath,
		pack.contractId,
		pack.idempotencyKey,
		pack.compactionLedger?.entryHash,
		pack.compactionLedger?.prevHash,
	].some((item: any) => Boolean(item?.includes(ref)));
}

export function commandTargetSuffix(target?: string): string {
	return target ? ` ${target}` : "";
}

export function contextRefLooksExplicit(ref?: string): boolean {
	return Boolean(
		ref &&
			(/(?:recon|\.pi)\/evidence\/contexts|\.md$|^\/|^\.\.?\/|context-pack\/|compaction/i.test(ref) ||
				existsSync(ref) ||
				existsSync(join(process.cwd(), ref))),
	);
}

export function contextPackSha256(pack: ContextPackArtifact): string {
	return createHash("sha256")
		.update(JSON.stringify(contextPackHashPayload(pack)))
		.digest("hex");
}
