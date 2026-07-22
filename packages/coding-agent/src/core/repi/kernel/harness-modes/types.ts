/** Harness mode shared types. */
export type RepiPermissionMode = "default" | "plan" | "acceptEdits" | "bypass";

export type RepiPlanTodo = {
	text: string;
	completed: boolean;
};

export type RepiHarnessModeState = {
	permissionMode: RepiPermissionMode;
	planTodos: RepiPlanTodo[];
	executionArmed: boolean;
};

export function parsePermissionMode(value: string | undefined): RepiPermissionMode | undefined {
	if (!value) return undefined;
	const mode = value.trim();
	if (mode === "default" || mode === "plan" || mode === "acceptEdits" || mode === "bypass") return mode;
	return undefined;
}

export function createHarnessModeState(initial: RepiPermissionMode = "default"): RepiHarnessModeState {
	return {
		permissionMode: initial,
		planTodos: [],
		executionArmed: initial !== "plan",
	};
}
