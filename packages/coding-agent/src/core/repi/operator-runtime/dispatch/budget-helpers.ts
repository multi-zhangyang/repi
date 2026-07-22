/** Operator budget helpers: commander budget value + command classifier. */

export function commanderBudgetValue(lines: string[] | undefined, key: string, fallback: number): number {
	const line = (lines ?? []).find((item: any) => item.startsWith(`${key}=`));
	const value = line ? Number(line.replace(/^.+?=/, "")) : Number.NaN;
	return Number.isFinite(value) ? value : fallback;
}

export function isCommanderRuntimeCommand(command: string): boolean {
	return /^re[-_](swarm|supervisor|context|operator|proof[-_]loop|verifier|compiler|replayer|autofix)\b/i.test(
		command.trim().replace(/^\//, ""),
	);
}
