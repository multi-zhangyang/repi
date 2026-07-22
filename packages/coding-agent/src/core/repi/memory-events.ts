/**
 * Memory event appenders + orchestrator format (completion/replayer/autofix).
 * Reverse proof blockers are recorded into completion memory domain tags/lessons.
 */

export {
	appendAutofixMemoryEvent,
	appendCompletionMemoryEvent,
	appendReplayerMemoryEvent,
} from "./memory-events-append.ts";
export type { MemoryEventsDeps } from "./memory-events-deps.ts";
export {
	autofixMemoryOutcome,
	configureMemoryEvents,
	replayMemoryOutcome,
} from "./memory-events-deps.ts";
export { formatMemoryOrchestrator } from "./memory-events-format.ts";
