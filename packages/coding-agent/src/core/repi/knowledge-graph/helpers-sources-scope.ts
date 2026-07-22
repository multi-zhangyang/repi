/** Knowledge-graph scope isolation builder. */

import {
	buildKnowledgeScopeIsolation as buildRepiKnowledgeScopeIsolation,
	type KnowledgeScopeIsolationV1,
} from "../knowledge-scope.ts";
import { buildMemoryScopeIsolationReport, readMemoryEvents } from "./deps.ts";

export function buildKnowledgeScopeIsolation(options: {
	target?: string;
	sources: Array<{ kind: string; path: string; text: string }>;
}): KnowledgeScopeIsolationV1 {
	const events = readMemoryEvents();
	const report = buildMemoryScopeIsolationReport({ target: options.target, events });
	return buildRepiKnowledgeScopeIsolation({ sources: options.sources, events, memoryScopeReport: report });
}
