/**
 * Attack-graph DI deps and passthrough stubs.
 */
export type AttackGraphDeps = {
	appendEvidence: (...args: any[]) => any;
	updateMissionCheckpoint: (...args: any[]) => any;
	latestScopedMarkdownArtifact: (...args: any[]) => string | undefined;
	activeLane: (...args: any[]) => any;
	inferTargetFromMap: (...args: any[]) => string | undefined;
	recommendedToolsForRoute: (...args: any[]) => string[];
	createBootstrapPlan: (...args: any[]) => any[];
};

let attackGraphDeps: AttackGraphDeps | null = null;

export function configureAttackGraph(deps: AttackGraphDeps): void {
	attackGraphDeps = deps;
}

export function deps(): AttackGraphDeps {
	if (!attackGraphDeps) {
		throw new Error("attack-graph not configured; call configureAttackGraph() from REPI kernel init");
	}
	return attackGraphDeps;
}

export function appendEvidence(...args: any[]): any {
	return deps().appendEvidence(...args);
}

export function updateMissionCheckpoint(...args: any[]): any {
	return deps().updateMissionCheckpoint(...args);
}

export function latestScopedMarkdownArtifact(...args: any[]): string | undefined {
	return deps().latestScopedMarkdownArtifact(...args);
}

export function activeLane(...args: any[]): any {
	return deps().activeLane(...args);
}

export function inferTargetFromMap(...args: any[]): string | undefined {
	return deps().inferTargetFromMap(...args);
}

export function recommendedToolsForRoute(...args: any[]): string[] {
	return deps().recommendedToolsForRoute(...args);
}

export function createBootstrapPlan(...args: any[]): any[] {
	return deps().createBootstrapPlan(...args);
}
