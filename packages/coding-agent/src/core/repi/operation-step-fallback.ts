/** Operation step handlers: bootstrap/complete + reverse_next fallback. */

import type { ExtensionAPI } from "../extensions/types.ts";
import { d } from "./operation-step-deps.ts";
import type { OperationExecution } from "./operator-step.ts";
import { reverseDomainCaptureNextCommands } from "./reverse-capture.ts";

type Done = (output: string) => OperationExecution;
type Blocked = (output: string) => OperationExecution;

export async function executeOperationFallbackStep(
	_pi: ExtensionAPI,
	command: string,
	target: string | undefined,
	done: Done,
	blocked: Blocked,
): Promise<OperationExecution> {
	if (/^re_bootstrap\s+plan\b/i.test(command)) {
		const tools = command
			.replace(/^re_bootstrap\s+plan\b/i, "")
			.trim()
			.split(/\s+/)
			.filter(Boolean);
		return done(
			d().formatBootstrapPlan(
				d().createBootstrapPlan(tools.length ? tools : ["checksec", "gdb", "radare2", "binwalk", "nmap", "ffuf"]),
			),
		);
	}
	if (/^re_complete\s+audit$/i.test(command)) return done(d().formatCompletionAudit());
	if (/^re_complete\s+scaffold\b/i.test(command))
		return done(`${d().writeReportScaffold()}\n\n${d().formatCompletionAudit()}`);
	const reverseHint = reverseDomainCaptureNextCommands({
		routeOrBlob: command,
		target,
	}).slice(0, 3);
	return blocked(
		[
			`unsupported operation command: ${command}`,
			...(reverseHint.length ? ["reverse_next:", ...reverseHint] : []),
		].join("\n"),
	);
}
