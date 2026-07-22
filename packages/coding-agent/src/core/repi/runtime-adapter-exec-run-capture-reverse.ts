/** Runtime adapter reverse proof footer + evidence append. */

import {
	reverseAdapterCaptureProofFields,
	reverseDomainCaptureNextCommands,
	reverseTechniqueCaptureBind,
} from "./reverse-capture.ts";
import { appendReverseRuntimeEvidence } from "./reverse-io.ts";
import { formatRuntimeAdapterExecutionArtifact, type RuntimeAdapterExecutionArtifactV1 } from "./runtime-adapter.ts";
import { appendEvidence } from "./runtime-adapter-exec-deps.ts";
import { techniqueById } from "./techniques.ts";

export function appendRuntimeAdapterCaptureEvidence(params: {
	adapter: any;
	selectedRunner: "native" | "fallback";
	target: string;
	result: { code: number; stdout: string; stderr: string; killed?: boolean };
	artifact: RuntimeAdapterExecutionArtifactV1;
	path: string;
}): string {
	const { adapter, selectedRunner, target, result, artifact, path } = params;
	const combinedOutput = `${result.stdout}\n${result.stderr}\n${formatRuntimeAdapterExecutionArtifact(artifact, path)}`;
	const captureLines = reverseAdapterCaptureProofFields(combinedOutput, [
		`summary.adapter=${adapter.adapterId}`,
		...artifact.parserSignals.flatMap((row: any) =>
			row.matches.length
				? [`technique.proof_exit_signal=${row.proofExitSignal}`, `summary.parser_rule=${row.ruleId}`]
				: [],
		),
		...(artifact.parserSignalSummary?.missingProofExitSignals ?? []).map(
			(signal: string) => `summary.adapter_missing_proof=${signal}`,
		),
	]);
	const techIds = [
		"rev-checksec-fingerprint-first",
		"rev-rop-chain-ret2csu",
		"pwn-orw-seccomp-bypass",
		"native-angr-symbolic-branch",
		"mobile-apk-triage-frida-bridge",
	].filter((id: any) => Boolean(techniqueById(id)));
	const runtimeProof =
		captureLines.find((line: any) => /^proof\.exit=/.test(line))?.replace(/^proof\.exit=/, "") ||
		captureLines.find((line: any) => /^query\.proof_exit=/.test(line))?.replace(/^query\.proof_exit=/, "") ||
		"pending_runtime_capture";
	const bind = reverseTechniqueCaptureBind({ techniqueIds: techIds, runtimeProofExit: runtimeProof });
	appendEvidence({
		kind: "runtime",
		title: `runtime-adapter ${adapter.adapterId}`,
		fact: `RuntimeAdapterExecutionCheckV1 adapter=${adapter.adapterId} runner=${selectedRunner} exit=${result.code} parser_matches=${artifact.parserSignals.reduce((sum: any, row: any) => sum + row.matches.length, 0)} ingest=evidence-ledger,knowledge-graph,re_note proof_exit=${runtimeProof} bind_ready=${bind.ready}`,
		command: `re_runtime_adapter run ${adapter.adapterId} ${target}`,
		path,
		verify: `cat ${path}`,
		confidence:
			"runtime:adapter-execution adapter_runner_parser_ingest_contract runner_output_parser_must_write_artifact",
		query: {
			adapter: adapter.adapterId,
			proof_exit: runtimeProof,
			bind_ready: bind.ready ? "true" : "false",
			...Object.fromEntries(
				captureLines
					.map((line: any) => /^(?:query|summary)\.([A-Za-z0-9_]+)=(.*)$/.exec(line))
					.filter(Boolean)
					.map((m: any) => [m![1], m![2].slice(0, 300)] as const),
			),
		},
		meta: {
			capture_lines: captureLines.slice(0, 24),
			bind_lines: bind.lines.slice(0, 16),
			reverse_proof_gate: "require_proof_exit_before_claim",
		},
	} as any);
	try {
		appendReverseRuntimeEvidence(
			"runtime_adapter",
			String(target ?? adapter?.adapterId ?? "adapter"),
			path,
			[...captureLines, ...bind.lines],
			String(runtimeProof || "pending_runtime_capture"),
		);
	} catch {
		/* reverse ledger best-effort */
	}

	const techniqueBridge = `[runtime-adapter-technique] re_techniques show ${techIds.join(" | ")}`;
	const reverseNext = /^(partial_runtime_capture|runtime_capture_strong)$/i.test(runtimeProof)
		? [
				`proof.exit=${runtimeProof}`,
				`bind_ready=${bind.ready ? "true" : "false"}`,
				"reverse_proof_gate=require_proof_exit_before_claim",
			]
		: [
				"proof.exit=pending_runtime_capture",
				"bind_ready=false",
				"reverse_proof_gate=require_proof_exit_before_claim",
				...reverseDomainCaptureNextCommands({
					routeOrBlob: `runtime-adapter ${adapter.adapterId} ${target ?? ""}`,
					target,
					includeGates: true,
				}).map((cmd: any) => (cmd.startsWith("reverse_runtime_capture_gate:") ? cmd : `next: ${cmd}`)),
			];
	return [
		formatRuntimeAdapterExecutionArtifact(artifact, path),
		techniqueBridge,
		...captureLines.slice(0, 12),
		...bind.lines.slice(0, 8),
		...reverseNext,
	].join("\n");
}
