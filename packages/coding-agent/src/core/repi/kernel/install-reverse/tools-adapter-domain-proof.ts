/** Reverse install tool: re_domain_proof_exit. */
import { Type } from "typebox";
import type { ExtensionAPI } from "../../../extensions/types.ts";
import { softFillOptionalOrchestrationWhenReverseReady } from "../../completion-audit/soft-fill-optional.ts";
import { auditCompletion } from "../../completion-audit.ts";
import { buildCompleteReadySkeleton } from "../install-proof-tools/complete-ready-skeleton.ts";
import { tryReverseReadyDomainProofStop } from "./tools-adapter-ready-stop.ts";
import { isMissionReverseBound } from "./tools-capture-inflight.ts";
import type { ReverseRuntimeToolDeps, ToolRegistrar } from "./types.ts";

export function registerRepiDomainProofExitTool(
	registerTool: ToolRegistrar,
	_pi: ExtensionAPI,
	deps: ReverseRuntimeToolDeps,
): void {
	registerTool({
		name: "re_domain_proof_exit",
		label: "RE Domain Proof Exit Closure",
		description:
			"Check whether the active reverse/pentest domain has runtime evidence satisfying ToolchainDomainCapabilityV1 proof-exit criteria before final completion. Catalog technique.proofExit alone is insufficient; require proof.exit=partial_runtime_capture|runtime_capture_strong and bind_ready=true.",
		promptSnippet:
			"Use re_domain_proof_exit before final claims to convert missing domain proof exits into concrete next commands.",
		promptGuidelines: [
			"Call re_domain_proof_exit show after re_lane/re_native_runtime/re_live_browser/replayer/proof-loop artifacts exist.",
			"Treat domain_proof_exit_missing blockers as commands to run, not as narrative refusal.",
			"After domain proof passes, call re_operator plan then re_operator dispatch then re_complete before final HARNESS_BUGS/PROOF.",
		],
		parameters: Type.Object(
			{
				// Coerce freely: models pass show/write/audit/run/empty.
				action: Type.Optional(Type.String()),
				domain: Type.Optional(Type.String()),
			},
			{ additionalProperties: true },
		),
		async execute(_toolCallId, params: any, _signal?: any, _onUpdate?: any, _ctx?: any) {
			try {
				const domainStop = tryReverseReadyDomainProofStop();
				if (domainStop) return domainStop;
				const rawAction = String(params?.action ?? "show").toLowerCase();
				const action = rawAction === "write" ? "write" : "show";
				const domain =
					typeof params?.domain === "string" && params.domain.trim() ? params.domain.trim() : undefined;
				const report = deps.buildDomainProofExitClosure(deps.readCurrentMission(), domain);
				// Always persist so mission checkpoints update even when models omit action.
				const path = deps.writeDomainProofExitClosureArtifact(report);
				// If runtime proof already binds, soft-fill optional orchestration even when the
				// model forgets re_complete (common free-model skip after operator verify).
				if (report.status === "passed") {
					try {
						const audit = auditCompletion();
						if (audit?.ready) softFillOptionalOrchestrationWhenReverseReady(audit as any);
					} catch {
						/* optional */
					}
				}
				const format =
					typeof deps.formatDomainProofExitClosure === "function"
						? deps.formatDomainProofExitClosure
						: (r: any, p?: string) => JSON.stringify({ path: p, status: r?.status, domain: r?.domainId });
				let nextFooter = "";
				if (report.status === "passed") {
					const reverseBound = isMissionReverseBound();
					nextFooter = reverseBound
						? `\n\nnext_required:\n- re_operator plan (auto-dispatch when reverse bound)\n- re_complete audit once\n- then copy skeleton:\n\n${buildCompleteReadySkeleton({ thrash: false })}`
						: "\n\nnext_required:\n- re_operator plan <target>\n- re_operator dispatch <target> maxSteps=1\n- re_complete audit\n- then HARNESS_BUGS/PROOF only";
				}
				return {
					content: [
						{
							type: "text" as const,
							text: deps.truncateMiddle(`${format(report, path)}${nextFooter}`, 20000),
						},
					],
					details: {
						action,
						domain,
						path,
						status: report.status,
						missingProofExits: report.missingProofExits,
					} as Record<string, unknown>,
				};
			} catch (error) {
				const message = error instanceof Error ? error.stack || error.message : String(error);
				return {
					content: [
						{
							type: "text" as const,
							text: `re_domain_proof_exit error: ${message.slice(0, 4000)}`,
						},
					],
					details: { error: true, message: message.slice(0, 1000) } as Record<string, unknown>,
				};
			}
		},
	});
}
