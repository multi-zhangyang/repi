/** Lane-memory reuse feedback. */

import type { LaneCommandPack } from "./lane-commands.ts";
import type { MemoryOutcome, MemoryReuseFeedbackReference } from "./lane-memory-types.ts";
import type { LaneRunAnalysis } from "./lanes/specialist-evidence.ts";
import { readMemoryEvents } from "./memory-stubs.ts";
import type { MemoryEventV1 } from "./memory-transaction.ts";
import { appendMemoryEvent } from "./memory-transaction.ts";
/**
 * Lane-run memory deposition + reuse feedback (gated memory product path).
 */
import { uniqueNonEmpty } from "./text.ts";

export function configureLaneMemory(_deps: Record<string, never> = {}): void {}

export function memoryReuseFeedbackReferences(pack: LaneCommandPack): MemoryReuseFeedbackReference[] {
	const refs = new Map<string, MemoryReuseFeedbackReference>();
	for (const command of pack.commands) {
		const eventId =
			/^memory-(?:event|sediment):(mem:[a-z0-9-]+):/i.exec(command.label)?.[1] ??
			/(?:structured memory event|mandatory memory injection packet event=)\s*(mem:[a-z0-9-]+)/i.exec(
				command.evidence,
			)?.[1];
		if (!eventId) continue;
		const caseSignature = /\bcase=([a-f0-9]{12,64})\b/i.exec(command.evidence)?.[1];
		const score = Number(/\bscore=([0-9]+(?:\.[0-9]+)?)\b/i.exec(command.evidence)?.[1]);
		const ref = refs.get(eventId) ?? {
			eventId,
			caseSignature,
			score: Number.isFinite(score) ? score : undefined,
			commands: [],
		};
		ref.caseSignature ??= caseSignature;
		if (Number.isFinite(score)) ref.score = Math.max(ref.score ?? 0, score);
		if (!ref.commands.includes(command.command)) ref.commands.push(command.command);
		refs.set(eventId, ref);
	}
	return Array.from(refs.values()).slice(0, 8);
}

export function appendMemoryReuseFeedback(
	pack: LaneCommandPack,
	result: { code: number; stdout: string; stderr: string; killed?: boolean },
	analysis: LaneRunAnalysis,
	artifactPath: string,
): MemoryEventV1[] {
	const refs = memoryReuseFeedbackReferences(pack);
	if (refs.length === 0) return [];
	const events = readMemoryEvents();
	const byId = new Map(events.map((event: any) => [event.id, event]));
	const strongReuse = result.code === 0 && !result.killed && analysis.critic.verdict === "strong";
	const usableReuse = result.code === 0 && !result.killed && analysis.critic.verdict !== "weak";
	const outcome: MemoryOutcome = result.killed ? "blocked" : usableReuse ? "success" : "failure";
	const verdict = analysis.critic.verdict;
	return refs.flatMap((ref: any) => {
		const original = byId.get(ref.eventId);
		const caseSignature = ref.caseSignature ?? original?.caseSignature;
		if (!caseSignature) return [];
		const commands = uniqueNonEmpty(ref.commands, 12);
		const event = appendMemoryEvent({
			source: "operator",
			task: `memory reuse feedback ${pack.route}/${pack.lane}`,
			route: pack.route,
			target: pack.target,
			domainTags: uniqueNonEmpty(
				["memory-feedback", "memory-reuse", `reuse-${outcome}`, ...(original?.domainTags ?? [])],
				24,
			),
			caseSignature,
			outcome,
			lessons: [
				usableReuse
					? `Historical memory event ${ref.eventId} was reused in ${pack.route}/${pack.lane} with evidence verdict ${verdict}.`
					: `Historical memory event ${ref.eventId} was reused in ${pack.route}/${pack.lane} but produced ${verdict} evidence or nonzero execution.`,
			],
			failurePatterns:
				outcome === "success"
					? []
					: [
							`memory_reuse_feedback_failed event=${ref.eventId} exit=${result.code} verdict=${verdict} deficits=${analysis.critic.deficits.slice(0, 4).join(" | ")}`,
						],
			reuseRules:
				outcome === "success"
					? [
							`memory_reuse_feedback_promote event=${ref.eventId} route=${pack.route} lane=${pack.lane} when target shape and artifacts match.`,
						]
					: [
							`memory_reuse_feedback_demote event=${ref.eventId} route=${pack.route} lane=${pack.lane} until a stronger verifier closes the deficits.`,
						],
			commands,
			artifactPaths: [artifactPath],
			confidence: strongReuse ? 0.88 : usableReuse ? 0.72 : 0.34,
			replayVerified: strongReuse,
			playbookCandidate: strongReuse,
			verifierRuleCandidate: usableReuse,
		});
		return [event];
	});
}
