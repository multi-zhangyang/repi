/** Assemble domain proof-exit corpus with reverse capture rollup. */
import type { DomainProofExitCorpus } from "./types.ts";

export function assembleDomainProofExitCorpus(params: {
	taskHints: string[];
	artifacts: Array<{ path: string; text: string }>;
	hashText: (text: string) => string;
	truncate: (text: string, max: number) => string;
}): DomainProofExitCorpus {
	const sources: string[] = [];
	const parts: string[] = [...params.taskHints];
	for (const item of params.artifacts) {
		if (!item.path || !item.text.trim()) continue;
		sources.push(item.path);
		parts.push(`\n--- artifact:${item.path} ---\n${params.truncate(item.text, 16000)}`);
	}
	const joined = parts.join("\n");
	const captureHits = [
		...(joined.match(/proof\.exit\s*=\s*(?:partial_runtime_capture|runtime_capture_strong)/gi) ?? []),
		...(joined.match(/query\.proof_exit\s*=\s*(?:partial_runtime_capture|runtime_capture_strong)/gi) ?? []),
		...(joined.match(/bind_ready\s*=\s*true/gi) ?? []),
		...(joined.match(/\[(?:native|mobile|exploit-lab|browser|web-authz)-proof-capture\]/gi) ?? []),
	];
	if (captureHits.length) {
		parts.push(`\n--- reverse_runtime_capture_rollup ---\n${captureHits.slice(0, 24).join("\n")}`);
		sources.push("reverse_runtime_capture_rollup");
	}
	const text = parts.join("\n");
	return { sources, text, hash: params.hashText(text) };
}
