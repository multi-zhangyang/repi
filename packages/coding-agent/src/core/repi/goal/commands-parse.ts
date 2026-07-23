import type { AutocompleteItem } from "@repi/tui";
import { parseObjective, tokenize } from "./prompt.ts";
import type { RepiGoalCommandResult } from "./types.ts";
import { EDIT_TOKEN_COMPLETION, GOAL_ARGUMENT_COMPLETIONS } from "./types.ts";

export function completeGoalArguments(argumentPrefix: string): AutocompleteItem[] | null {
	const prefix = argumentPrefix.trimStart();
	if (prefix === "") return [...GOAL_ARGUMENT_COMPLETIONS];

	const editOptionPrefix = /^edit\s+(\S*)$/.exec(prefix)?.[1];
	if (editOptionPrefix !== undefined) {
		return editOptionPrefix === "" || "--tokens".startsWith(editOptionPrefix) ? [EDIT_TOKEN_COMPLETION] : null;
	}

	if (/\s/.test(prefix)) return null;

	const matches = GOAL_ARGUMENT_COMPLETIONS.filter(
		(item: any) => item.value.startsWith(prefix) || item.label.startsWith(prefix),
	);
	return matches.length > 0 ? [...matches] : null;
}

export function parseGoalCommand(args: string): RepiGoalCommandResult | string {
	const tokens = tokenize(args.trim());
	if (tokens.length === 0) return { kind: "show" };

	const [first, ...rest] = tokens;
	if (first === "pause") return rest.length === 0 ? { kind: "pause" } : "Usage: /goal pause";
	if (first === "resume") return rest.length === 0 ? { kind: "resume" } : "Usage: /goal resume";
	if (first === "clear" || first === "stop") return rest.length === 0 ? { kind: "clear" } : "Usage: /goal clear";
	if (first === "status") return rest.length === 0 ? { kind: "show" } : "Usage: /goal status";
	if (first === "help") return rest.length === 0 ? { kind: "help" } : "Usage: /goal help";
	if (first === "edit") return parseObjective("edit", rest);
	return parseObjective("start", tokens);
}
