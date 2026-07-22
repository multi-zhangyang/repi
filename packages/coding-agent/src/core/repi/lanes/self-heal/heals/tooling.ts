import { interestingLines } from "../../../text.ts";
import { toolRepairMatrixScript, transcriptRepairItems } from "../helpers.ts";
import type { SelfHealCtx } from "./ctx.ts";

export function appendToolingHeals(ctx: SelfHealCtx): void {
	const {
		pack,
		result: _result,
		findings: _findings,
		deficits: _deficits,
		route,
		combined,
		target,
		add,
		toolNames,
	} = ctx;
	if (/command not found|not found|no such file|cannot access|permission denied/i.test(combined)) {
		for (const command of toolNames.slice(0, 5)) add(command.label, command.command, command.evidence);
		const repairItems = transcriptRepairItems(combined);
		add(
			"heal-tool-repair-matrix",
			toolRepairMatrixScript({
				pack,
				combined,
				repairItems,
				errorLines: interestingLines(
					combined,
					/command not found|not found|no such file|cannot access|permission denied|ModuleNotFoundError|ImportError|Cannot find module/i,
					12,
				),
			}),
			"runtime tool/dependency repair matrix with alternatives and bootstrap hints",
		);
		if (pack.target) {
			add(
				"heal-target-path-check",
				`ls -la ${target}; file ${target} 2>/dev/null || true`,
				"target path/format sanity",
			);
		}
	}
	if (!target) {
		if (/native|pwn|reverse|binary|elf/i.test(route)) {
			add(
				"heal-discover-binary-targets",
				'find . -maxdepth 4 -type f -exec sh -c \'file "$1" | grep -Eq "ELF|PE32|Mach-O|WebAssembly" && printf "%s\\n" "$1"\' _ {} \\; | head -80',
				"recover concrete binary targets before rerun",
			);
		} else {
			add(
				"heal-passive-target-inventory",
				"pwd; find . -maxdepth 4 -type f | sort | head -240",
				"recover concrete target candidates",
			);
		}
	}
}
