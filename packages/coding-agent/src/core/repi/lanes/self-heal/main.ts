/** Self-heal command generation from failed evidence/runtime output. */

import { shellQuote } from "../../target.ts";
import type { LaneCommand } from "../specialist-packs.ts";
import { appendAgentHeals } from "./heals/agent.ts";
import { appendCloudHeals } from "./heals/cloud.ts";
import { appendCryptoHeals } from "./heals/crypto.ts";
import type { SelfHealCtx } from "./heals/ctx.ts";
import { appendExploitHeals } from "./heals/exploit.ts";
import { appendGenericHeals } from "./heals/generic.ts";
import { appendIdentityHeals } from "./heals/identity.ts";
import { appendMalwareHeals } from "./heals/malware.ts";
import { appendNativeHeals } from "./heals/native.ts";
import { appendPwnHeals } from "./heals/pwn.ts";
import { appendReverseHeals } from "./heals/reverse.ts";
import { appendSpecialistHeals } from "./heals/specialist.ts";
import { appendToolingHeals } from "./heals/tooling.ts";
import { appendWebHeals } from "./heals/web.ts";
import { commandKnownTools, dedupeLaneCommands } from "./helpers.ts";
import type { LaneCommandPack } from "./types.ts";

export function selfHealCommandsForEvidence(params: {
	pack: LaneCommandPack;
	result: { code: number; stdout: string; stderr: string; killed?: boolean };
	findings: string[];
	deficits: string[];
}): LaneCommand[] {
	const { pack, result, findings, deficits } = params;
	const commands: LaneCommand[] = [];
	const route = pack.route.toLowerCase();
	const combined = `${result.stdout}\n${result.stderr}`;
	const target = pack.target ? shellQuote(pack.target) : undefined;
	const add = (label: string, command: string, evidence: string) => commands.push({ label, command, evidence });
	const toolNames = dedupeLaneCommands(
		commandKnownTools(pack.commands.map((command: any) => command.command).join("\n")).map((tool: any) => ({
			label: `tool-check-${tool}`,
			command: `command -v ${shellQuote(tool)} || true`,
			evidence: `availability check for ${tool}`,
		})),
	);

	const ctx: SelfHealCtx = {
		pack,
		result,
		findings,
		deficits,
		route,
		combined,
		target,
		add,
		toolNames,
	};
	// tooling heals use toolNames as LaneCommand-like via add on items - pass through commands list pattern in tooling module using toolNames strings only.
	// Original tooling iterated toolNames as {label,command,evidence}[]. Fix tooling to use local rebuild if needed.

	appendToolingHeals(ctx);
	appendNativeHeals(ctx);
	appendWebHeals(ctx);
	appendPwnHeals(ctx);
	appendExploitHeals(ctx);
	appendSpecialistHeals(ctx);
	appendCryptoHeals(ctx);
	appendAgentHeals(ctx);
	appendMalwareHeals(ctx);
	appendCloudHeals(ctx);
	appendIdentityHeals(ctx);
	appendGenericHeals(ctx);
	appendReverseHeals(ctx);

	return dedupeLaneCommands(commands).slice(0, 12);
}
