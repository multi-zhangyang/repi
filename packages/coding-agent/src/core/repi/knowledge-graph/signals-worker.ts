/** Knowledge-graph: worker/dispatcher scoreboard signal nodes. */

import { buildWorkerPromotionQueue } from "../autonomous-budget/deps.ts";
import { dispatcherAdaptiveRoutingHints, workerAdaptiveRoutingHints } from "../delegate/deps.ts";
import { dispatcherPromotionQueue } from "../delegate/pure.ts";
import { autonomousExecutionBudget, latestDispatcherFeedbackBoard, latestWorkerScoreboard } from "./deps.ts";
import {
	appendDispatcherDecayDemotionNodes,
	appendDispatcherFeedbackNodes,
	appendWorkerScoreboardNodes,
} from "./signals-worker-nodes.ts";
import { appendHighScorePromotionNodes } from "./signals-worker-promotions.ts";
import { workerDispatcherReverseHints } from "./signals-worker-reverse.ts";
import type { KnowledgeEdge, KnowledgeNode } from "./types.ts";

export function appendWorkerDispatcherSignalNodes(input: {
	nodes: KnowledgeNode[];
	edges: KnowledgeEdge[];
	missionNodeId: string;
	route?: string;
	target?: string;
	missionTask?: string;
}): {
	scoreboard: ReturnType<typeof latestWorkerScoreboard>;
	adaptiveRoutingHints: string[];
	workerPromotionQueue: string[];
	dispatcherBoard: ReturnType<typeof latestDispatcherFeedbackBoard>;
	autonomousBudget: ReturnType<typeof autonomousExecutionBudget>;
	dispatcherScoreDecay: any[];
	repeatedFailureDemotions: any[];
	highScorePromotions: any[];
} {
	const { nodes, edges, missionNodeId, route } = input;
	const options = { target: input.target ?? input.missionTask };
	const mission = { task: input.missionTask } as { task?: string };
	const scoreboard = latestWorkerScoreboard();
	appendWorkerScoreboardNodes({
		entries: scoreboard.entries,
		scoreboardPath: scoreboard.path,
		nodes,
		edges,
		missionNodeId,
		route,
	});
	const adaptiveRoutingHints = Array.from(
		new Set([
			...workerAdaptiveRoutingHints(scoreboard.entries, options.target ?? mission?.task),
			...dispatcherAdaptiveRoutingHints(options.target ?? mission?.task),
		]),
	).slice(0, 32);
	const workerPromotionQueue = Array.from(
		new Set([
			...buildWorkerPromotionQueue(scoreboard.entries, options.target ?? mission?.task),
			...dispatcherPromotionQueue(options.target ?? mission?.task),
		]),
	).slice(0, 24);
	const dispatcherBoard = latestDispatcherFeedbackBoard();
	const autonomousBudget = autonomousExecutionBudget(options.target ?? mission?.task, dispatcherBoard.lines);
	const dispatcherScoreDecay = autonomousBudget.scoreDecay;
	const repeatedFailureDemotions = autonomousBudget.demotionRules;
	const highScorePromotions = autonomousBudget.promotionRules;
	appendDispatcherFeedbackNodes({
		lines: dispatcherBoard.lines,
		boardPath: dispatcherBoard.path,
		nodes,
		edges,
		missionNodeId,
		route,
	});
	appendDispatcherDecayDemotionNodes({
		dispatcherScoreDecay,
		repeatedFailureDemotions,
		boardPath: dispatcherBoard.path,
		promotionPlaybookPath: autonomousBudget.promotionPlaybookPath,
		nodes,
		edges,
		missionNodeId,
		route,
	});
	appendHighScorePromotionNodes({
		highScorePromotions,
		nodes,
		edges,
		missionNodeId,
		route,
		promotionPlaybookPath: autonomousBudget?.promotionPlaybookPath,
		dispatcherBoardPath: dispatcherBoard?.path,
	});
	adaptiveRoutingHints.push(
		...workerDispatcherReverseHints({ scoreboardLines: scoreboard?.lines, adaptiveRoutingHints }),
	);
	return {
		scoreboard,
		adaptiveRoutingHints,
		workerPromotionQueue,
		dispatcherBoard,
		autonomousBudget,
		dispatcherScoreDecay,
		repeatedFailureDemotions,
		highScorePromotions,
	};
}
