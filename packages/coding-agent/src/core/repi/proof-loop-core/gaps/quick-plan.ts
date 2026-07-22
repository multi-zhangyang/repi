/** Proof-loop quick plan rows with reverse domain next. */
import type { RepiProofLoopGapItem as ProofLoopGapItem } from "../../proof-loop/types.ts";
import { repiProofLoopQuickPlanFromItems as proofLoopQuickPlanFromItems } from "../../proof-loop.ts";
import { reverseDomainCaptureNextCommands } from "../../reverse-capture.ts";
import { proofLoopTargetRuntimeAdapterCommands } from "./quick-target.ts";

export function proofLoopQuickPlanRows(
	items: ProofLoopGapItem[],
	target?: string,
): {
	commands: string[];
	phases: string[];
	assertions: string[];
} {
	const targetRuntimeCommands = proofLoopTargetRuntimeAdapterCommands(target);
	const targetRuntimeCommandSet = new Set(targetRuntimeCommands);
	const plan = proofLoopQuickPlanFromItems(items, target);
	const reverseProofCommands = reverseDomainCaptureNextCommands({
		routeOrBlob: items.map((item: any) => JSON.stringify(item)).join("\n"),
		target: target,
	});
	const reverseGap =
		items.some((item: any) =>
			/technique|proof_exit|mitre|cwe|reverse_kind|native-runtime|malware|firmware|pwn|bind_ready|pending_runtime_capture|reverse_proof|capture_signals|mobile-runtime|exploit-lab/i.test(
				`${item.text ?? ""} ${item.source ?? ""} ${item.worker ?? ""} ${item.class ?? ""} ${item.classes ?? ""}`,
			),
		) ||
		items.some((item: any) =>
			/reverse_proof_exit|domain_proof_exit|runtime_capture/i.test(String(item.class ?? item.classes ?? "")),
		);
	const commands = Array.from(
		new Set([...targetRuntimeCommands, ...(reverseGap ? reverseProofCommands : []), ...plan.commands]),
	);
	return {
		commands,
		phases: [
			...(targetRuntimeCommands.length
				? [
						`phase=0:target_runtime_frontload reason="auto-detected live target runtime adapters before stale artifact replay" classes=runtime_adapter_gap commands=${targetRuntimeCommands.join(" && ")} evidence=target_profile:auto-detect`,
					]
				: []),
			...(reverseGap
				? [
						`phase=0b:reverse_proof_exit reason="technique/mitre/cwe reverse gaps require proof_exit and domain proof-exit before claim" classes=reverse_proof_exit,domain_proof_exit,runtime_capture commands=${reverseProofCommands.join(" && ")} evidence=query.proof_exit|bind_ready|domain_proof_exit_closure|runtime_capture`,
					]
				: []),
			...plan.phases.map(
				(phase, index) =>
					`phase=${index + 1}:${phase.phase} reason="${phase.reason}" classes=${phase.classes.join(",") || "any"} commands=${phase.commands.join(" && ")} evidence=${phase.evidenceRefs.join(" | ") || "none"}`,
			),
		].slice(0, 16),
		assertions: [
			`bounded=${commands.length <= 18 ? "pass" : "fail"} commands=${commands.length} omitted=${plan.omittedCommands.length}`,
			`deduplicated=${commands.length === new Set(commands).size ? "pass" : "fail"}`,
			`runtime_adapter_before_replay=${
				commands.some((command: any) => targetRuntimeCommandSet.has(command))
					? (
							() => {
								const adapterIndex = commands.findIndex((command: any) => targetRuntimeCommandSet.has(command));
								const replayIndex = commands.findIndex((command: any) => /^re_replayer run/i.test(command));
								return replayIndex < 0 || adapterIndex < replayIndex ? "pass" : "fail";
							}
						)()
					: plan.assertions.runtimeAdapterBeforeReplay
						? "pass"
						: "fail"
			}`,
			`autofix_apply_before_final_replay=${plan.assertions.autofixApplyBeforeFinalReplay ? "pass" : "fail"}`,
			`final_loop_last=${commands.at(-1) === plan.finalLoopCommand ? "pass" : "fail"} command=${plan.finalLoopCommand}`,
			`reverse_proof_exit_gate=${
				!reverseGap
					? "n/a"
					: commands.includes("re_domain_proof_exit show") && commands.includes("re_complete audit")
						? "pass"
						: "fail"
			}`,
		],
	};
}
