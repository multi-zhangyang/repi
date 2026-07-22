import { evidenceProofLoopsDir, readTextFile, recentMarkdownArtifacts } from "../storage.ts";
import { normalizeProofLoopExecution, normalizeProofLoopStep, stringArray } from "./helpers.ts";
import type { RepiProofLoopGraphArtifact, RepiProofLoopGraphExecution, RepiProofLoopGraphStep } from "./types.ts";

export function parseProofLoopArtifact(path: string): RepiProofLoopGraphArtifact | undefined {
	const match = /```json\s*([\s\S]*?)\s*```/m.exec(readTextFile(path));
	if (!match?.[1]) return undefined;
	try {
		const parsed = JSON.parse(match[1]) as Record<string, unknown>;
		if (!(parsed.mode === "plan" || parsed.mode === "run")) return undefined;
		if (!Array.isArray(parsed.steps) || !Array.isArray(parsed.executed)) return undefined;
		const steps = parsed.steps
			.map(normalizeProofLoopStep)
			.filter((step): step is RepiProofLoopGraphStep => Boolean(step));
		const executed = parsed.executed
			.map(normalizeProofLoopExecution)
			.filter((execution): execution is RepiProofLoopGraphExecution => Boolean(execution));
		return {
			timestamp: typeof parsed.timestamp === "string" ? parsed.timestamp : undefined,
			missionId: typeof parsed.missionId === "string" ? parsed.missionId : undefined,
			route: typeof parsed.route === "string" ? parsed.route : undefined,
			target: typeof parsed.target === "string" ? parsed.target : undefined,
			mode: parsed.mode,
			maxSteps: typeof parsed.maxSteps === "number" ? parsed.maxSteps : undefined,
			replaySteps: typeof parsed.replaySteps === "number" ? parsed.replaySteps : undefined,
			steps,
			executed,
			verdict: typeof parsed.verdict === "string" ? parsed.verdict : undefined,
			gapClassifier: stringArray(parsed.gapClassifier),
			quickPath: stringArray(parsed.quickPath),
			quickPlanPhases: stringArray(parsed.quickPlanPhases),
			quickPlanAssertions: stringArray(parsed.quickPlanAssertions),
			runtimeAdapterClosure: stringArray(parsed.runtimeAdapterClosure),
			nextActions: stringArray(parsed.nextActions),
			sourceArtifacts: stringArray(parsed.sourceArtifacts),
		};
	} catch {
		return undefined;
	}
}

export function recentProofLoopArtifacts(limit = 4): Array<{ path: string; proof: RepiProofLoopGraphArtifact }> {
	return recentMarkdownArtifacts(evidenceProofLoopsDir(), limit)
		.map((path: any) => {
			const proof = parseProofLoopArtifact(path);
			return proof ? { path, proof } : undefined;
		})
		.filter((item): item is { path: string; proof: RepiProofLoopGraphArtifact } => Boolean(item));
}

/** Minimal swarm artifact for attack-graph wiring (duck-typed). */
