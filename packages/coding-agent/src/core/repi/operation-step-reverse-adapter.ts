/** Operation reverse steps: runtime adapter + domain proof exit. */
import type { ExtensionAPI } from "../extensions/types.ts";
import { d } from "./operation-step-deps.ts";
import type { OperationExecution } from "./operator-step.ts";

type Done = (output: string) => OperationExecution;

export async function tryExecuteOperationReverseAdapterStep(
	pi: ExtensionAPI,
	command: string,
	target: string | undefined,
	done: Done,
): Promise<OperationExecution | undefined> {
	if (/^re[-_]runtime[-_]adapter\b/i.test(command)) {
		const m = /^re[-_]runtime[-_]adapter\s+(plan|show|run|refresh)?(?:\s+(.+?))?(?:\s+(\d+))?$/i.exec(command);
		const action = (m?.[1] as string | undefined)?.toLowerCase() || "run";
		const rest = (m?.[2] || "").trim();
		const timeoutMs = m?.[3] ? Number(m[3]) : undefined;
		let adapter: string | undefined;
		let runTarget = target;
		if (rest) {
			const parts = rest.split(/\s+/);
			if (parts[0] && !parts[0].includes("/") && !/^https?:/i.test(parts[0]) && parts.length > 1) {
				adapter = parts[0];
				runTarget = parts.slice(1).join(" ") || target;
			} else {
				runTarget = rest || target;
			}
		}
		if (action === "refresh") {
			return done(await d().refreshToolIndex(pi));
		}
		if (runTarget) {
			return done(
				await d().runRuntimeAdapterExecution(pi, {
					adapter,
					target: runTarget,
					timeoutMs,
				}),
			);
		}
		return done("runtime_adapter: requires target; next: re_runtime_adapter run <target>");
	}

	if (/^re[-_]domain[-_]proof[-_]exit\b/i.test(command)) {
		const domainMatch = /^re[-_]domain[-_]proof[-_]exit\s+(?:show|write|audit|run)?(?:\s+(\S+))?$/i.exec(command);
		const domain = domainMatch?.[1];
		const report = d().buildDomainProofExitClosure(d().readCurrentMission(), domain);
		const path = d().writeDomainProofExitClosureArtifact(report);
		const format =
			typeof d().formatDomainProofExitClosure === "function"
				? d().formatDomainProofExitClosure
				: (r: any, p?: string) => JSON.stringify({ path: p, status: r?.status, domain: r?.domainId });
		if (report.status === "passed") {
			try {
				const audit = d().auditCompletion?.();
				if (audit?.ready) d().softFillOptionalOrchestrationWhenReverseReady?.(audit);
			} catch {
				/* optional */
			}
		}
		return done(String(format(report, path)));
	}

	return undefined;
}
