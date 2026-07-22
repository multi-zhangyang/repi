/** Domain-specific lane command seeds (native/web/pwn + reverse next). */
import { classifyRepiTarget, shellQuote } from "../target.ts";
import { appendDomainLaneNativeCommands } from "./domain-lane-native.ts";
import { appendDomainLanePwnReverseCommands } from "./domain-lane-pwn.ts";
import type { DomainLaneCommandContext, DomainLaneRuntimeCtx } from "./domain-lane-types.ts";
import { appendDomainLaneWebCommands } from "./domain-lane-web.ts";

export type { DomainLaneCommand, DomainLaneCommandContext } from "./domain-lane-types.ts";

function pythonString(target: string): string {
	return JSON.stringify(target);
}

export function appendDomainLaneCommands(ctx: DomainLaneCommandContext): void {
	const { domain, laneName, effectiveTarget, commands, notes } = ctx;
	const targetArg = effectiveTarget ? shellQuote(effectiveTarget) : "<TARGET>";
	const targetPython = pythonString(effectiveTarget ?? "<TARGET>");
	const urlArg = effectiveTarget ?? "<URL>";
	const targetKind = classifyRepiTarget(effectiveTarget).kind;
	const targetIsDirectory = targetKind === "directory";
	const add = (label: string, command: string, evidence: string) => {
		if (!commands.some((item: any) => item.label === label && item.command === command)) {
			commands.push({ label, command, evidence });
		}
	};
	const isNativeRoute = domain === "Native reverse" || /native|binary|elf/i.test(domain);
	const isAndroidRoute = domain === "Mobile reverse" || /android|mobile|apk/i.test(domain);
	const isPwnRoute = domain === "Pwn / exploit" || /pwn|exploit/i.test(domain);
	const isWebRoute = domain === "Web / API pentest" || /web|api|authz/i.test(domain);
	const isJsRoute = domain === "Frontend / JS reverse" || /frontend|js|signing/i.test(domain);
	const runtime: DomainLaneRuntimeCtx = {
		...ctx,
		laneName,
		isNativeRoute,
		isAndroidRoute,
		isPwnRoute,
		isWebRoute,
		isJsRoute,
		targetIsDirectory,
		targetArg,
		targetPython,
		urlArg,
		add,
	};
	appendDomainLaneNativeCommands(runtime, add);
	appendDomainLaneWebCommands(runtime, add);
	appendDomainLanePwnReverseCommands(runtime, add);
	void notes;
}
