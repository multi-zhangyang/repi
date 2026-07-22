/** Autofix collect context type. */
import type { AutofixItem, AutofixItemKind } from "./types.ts";

export type AutofixCollectCtx = {
	options: { target?: string; mode?: "plan" | "apply" };
	replay: any;
	compiler: any;
	operatorFeedback: string[];
	patchQueue: AutofixItem[];
	commandSubstitutions: AutofixItem[];
	bootstrapQueue: AutofixItem[];
	evidenceRecaptureQueue: AutofixItem[];
	nextOperatorQueue: string[];
	add: (collection: AutofixItem[], kind: AutofixItemKind, source: string, reason: string, command: string) => void;
};
