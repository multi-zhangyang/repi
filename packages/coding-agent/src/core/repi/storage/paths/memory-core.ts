/** Memory path helpers: scope + core paths. */
import { join } from "node:path";
import { resolvePath } from "../../../../utils/paths.ts";
import { reconDir } from "./core.ts";

export function encodeCwdForScope(cwd: string): string {
	const resolvedCwd = resolvePath(cwd);
	return `--${resolvedCwd.replace(/^[/\]/, "").replace(/[/:]/g, "-")}--`;
}

let memoryScopeCwd: string | null = null;

export function setMemoryScopeCwd(cwd: string | null): void {
	memoryScopeCwd = cwd ? resolvePath(cwd) : null;
}

export function getMemoryScopeCwd(): string | null {
	return memoryScopeCwd;
}

export function scopedMemoryRoot(): string {
	if (memoryScopeCwd) {
		return join(reconDir(), "memory", "projects", encodeCwdForScope(memoryScopeCwd));
	}
	return join(reconDir(), "memory");
}

export function memoryPath(name: string): string {
	return join(scopedMemoryRoot(), name);
}

export function memoryPlaybooksDir(): string {
	return join(scopedMemoryRoot(), "playbooks");
}

export function memoryPlaybooksArchiveDir(): string {
	return join(memoryPlaybooksDir(), "archive");
}

export function memoryNotesDir(): string {
	return join(scopedMemoryRoot(), "notes");
}

export function memoryNotePath(name: string): string {
	return join(memoryNotesDir(), `${name}.md`);
}

export function memoryEventsPath(): string {
	return memoryPath("events.jsonl");
}

export function caseMemoryPath(): string {
	return memoryPath("case-memory.jsonl");
}

export function memoryCorePath(): string {
	return memoryPath("core-memory.md");
}

export function memoryProjectPath(): string {
	return memoryPath("project-memory.md");
}

export function memoryProceduralPath(): string {
	return memoryPath("procedural-memory.md");
}

export function memoryTransactionsDir(): string {
	return memoryPath("transactions");
}

export function memoryTransactionPath(id: string): string {
	return join(memoryTransactionsDir(), `${id}.json`);
}
