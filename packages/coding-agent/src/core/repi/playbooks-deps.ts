/** Playbook DI deps and shared types. */
export type PlaybookDeps = {
	normalizeHistoricalCommand: (...args: any[]) => any;
};

let playbookDeps: PlaybookDeps | null = null;

export function configurePlaybooks(deps: PlaybookDeps): void {
	playbookDeps = deps;
}

function d(): PlaybookDeps {
	if (!playbookDeps) throw new Error("playbooks not configured; call configurePlaybooks() from REPI kernel init");
	return playbookDeps;
}

export function normalizeHistoricalCommand(...args: any[]): any {
	return d().normalizeHistoricalCommand(...args);
}

export type MemoryCommandCandidate = {
	label: string;
	command: string;
	evidence: string;
	source: string;
	score: number;
};

export type PlaybookIndexEntry = {
	file: string;
	path: string;
	route: string;
	lane: string;
	target: string;
	timestamp: string;
	quality: number;
	ageDays: number;
	status: "active" | "archived";
	reason?: string;
};

export type PlaybookMaintenanceResult = {
	indexPath: string;
	active: PlaybookIndexEntry[];
	archived: PlaybookIndexEntry[];
};
