/** Operation command concrete helper with reverse domain next seed. */
import { reverseDomainCaptureNextCommands } from "../reverse-capture.ts";

export function operationCommandConcrete(
	command: string,
	target?: string,
): { command: string; blocked?: string; reverseNext?: string[] } {
	const targetText = target?.trim();
	let resolved = command;
	if (/<target>|<TARGET>|<URL>|<none>/i.test(command)) {
		if (!targetText) return { command, blocked: "target placeholder is unresolved" };
		resolved = command.replace(/<target>|<TARGET>|<URL>|<none>/gi, targetText);
	}
	const reverseHeavy =
		/native|pwn|malware|firmware|reverse|binary|exploit|mobile|browser|authz|web|proof_exit|bind_ready|re_native|re_live_browser|re_runtime_adapter/i.test(
			`${resolved} ${targetText ?? ""}`,
		);
	const reverseNext = reverseHeavy
		? reverseDomainCaptureNextCommands({
				routeOrBlob: `${resolved} ${targetText ?? ""}`,
				target: targetText,
				includeGates: true,
			}).slice(0, 2)
		: [];
	return reverseNext.length ? { command: resolved, reverseNext } : { command: resolved };
}
