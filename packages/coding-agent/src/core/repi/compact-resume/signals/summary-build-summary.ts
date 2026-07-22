/** Compaction summary builder (long-run lean). */
import { reverseDomainCaptureNextCommands } from "../../reverse-capture.ts";
import { reconCompactionBullets } from "./summary-format.ts";

export function buildReconCompactionSummary(params: { event: any; contextPack: any; contextPath: string }): string {
	const { event, contextPack, contextPath } = params;
	const targetSuffix = contextPack.target ? ` ${contextPack.target}` : "";
	const proofTarget = contextPack.target ?? "<target>";
	const reverseHeavySummary =
		/native|pwn|malware|firmware|reverse|binary|exploit|mobile|frontend|js|browser|authz|web|proof_exit|bind_ready/i.test(
			JSON.stringify({ route: contextPack.route, target: contextPack.target, next: contextPack.nextCommands }),
		);
	const reverseNext = reverseHeavySummary
		? reverseDomainCaptureNextCommands({
				routeOrBlob: JSON.stringify({ route: contextPack.route, target: contextPack.target }),
				target: contextPack.target,
				includeGates: true,
			})
		: [];
	const resumeCommands = Array.from(
		new Set([
			...reverseNext,
			"re_context resume",
			// Non-reverse packs may still use operator queue; reverse-heavy skips narrative operator plan.
			...(reverseHeavySummary ? [] : [`re_operator plan${targetSuffix}`, `re_operator dispatch${targetSuffix} 1`]),
			`re_proof_loop run ${proofTarget} 4 2`,
			...contextPack.nextCommands,
		]),
	).slice(0, 18);
	// Long-run lean: keep reverse/proof resume only. Drop memory product / dispatcher
	// narrative paths that re-inflate context after every compact.
	const reverseGateLines = reverseHeavySummary
		? [
				"## Reverse proof gate",
				"- catalog technique.proof_exit ≠ completion",
				"- require runtime proof.exit=partial_runtime_capture|runtime_capture_strong + bind_ready=true",
				...reverseNext.slice(0, 8).map((command: any) => `- next: ${command}`),
			]
		: [];
	return [
		"# REPI Compaction Summary",
		"",
		"kind: repi-compaction-lean",
		"",
		"## Resume contract",
		`- contextpath: ${contextPath}`,
		`- mission_id: ${contextPack.missionId ?? "none"}`,
		`- route: ${contextPack.route ?? "unknown"}`,
		`- target: ${contextPack.target ?? "<none>"}`,
		`- active_lane: ${contextPack.activeLane ?? "none"}`,
		...resumeCommands.slice(0, 10).map((command: any) => `- next: ${command}`),
		"",
		"## Compaction boundary",
		`- first_kept_entry_id: ${event.preparation.firstKeptEntryId}`,
		`- tokens_before: ${event.preparation.tokensBefore}`,
		`- summarized_messages: ${event.preparation.messagesToSummarize?.length ?? 0}`,
		`- previous_summary: ${event.preparation.previousSummary ? "present" : "none"}`,
		"",
		"## Mission brief",
		...reconCompactionBullets((contextPack.resumeBrief ?? []).slice(0, 8)),
		"",
		"## Decisive checks",
		...reconCompactionBullets((contextPack.checkSummary ?? []).slice(0, 10)),
		"",
		"## Decisive artifacts",
		...reconCompactionBullets(
			(contextPack.artifactIndex ?? []).slice(0, 12).map((artifact: any) => `${artifact.kind}: ${artifact.path}`),
		),
		"",
		...reverseGateLines,
		"",
		"## Rules after resume",
		"1. Prefer re_context resume only if needed; do not re-load memory product surfaces.",
		"2. Reverse-heavy: domain capture next before claim (`re_domain_proof_exit show` / re_* run).",
		"3. Preserve Outcome → Key Evidence → Next Step; cite decisive artifact paths only.",
	]
		.filter((line) => line !== undefined)
		.join("\n");
}
