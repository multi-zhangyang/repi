/** Attack-graph mission node helpers. */
import type { AttackGraphMissionSlice } from "./types.ts";

export function attackGraphMissionNodes(
	mission: {
		id: string;
		task: string;
		route: { domain: string; intent?: string };
		lanes: Array<{ name: string; status?: string; objective?: string; note?: string; next: string[] }>;
		checkpoints: Array<{ name: string; status: string; note?: string }>;
	},
	slug: (value: string) => string,
): AttackGraphMissionSlice {
	const nodes: AttackGraphMissionSlice["nodes"] = [];
	const edges: AttackGraphMissionSlice["edges"] = [];
	const taskTree: AttackGraphMissionSlice["taskTree"] = [];
	const gaps: string[] = [];
	const criticalPath: string[] = [];
	const missionId = `mission:${mission.id}`;
	nodes.push({ id: missionId, kind: "mission", label: mission.task, status: "active" });
	taskTree.push({ id: missionId, kind: "mission", label: mission.task, status: "active", note: mission.route.domain });
	nodes.push({
		id: `route:${slug(mission.route.domain)}`,
		kind: "route",
		label: mission.route.domain,
		note: mission.route.intent,
	});
	edges.push({ from: missionId, to: `route:${slug(mission.route.domain)}`, kind: "owns", label: "route" });
	criticalPath.push(missionId, `route:${mission.route.domain}`);
	let previousLane: string | undefined;
	for (const lane of mission.lanes) {
		const laneId = `lane:${slug(lane.name)}`;
		nodes.push({
			id: laneId,
			kind: "lane",
			label: lane.name,
			status: lane.status ?? "pending",
			note: lane.objective,
		});
		taskTree.push({
			id: laneId,
			parentId: missionId,
			kind: "lane",
			label: lane.name,
			status: lane.status ?? "pending",
			evidence: lane.next.slice(0, 4),
			note: lane.objective,
		});
		edges.push({ from: missionId, to: laneId, kind: "owns", label: "lane" });
		if (previousLane) edges.push({ from: previousLane, to: laneId, kind: "orders" });
		previousLane = laneId;
		if (lane.status === "blocked") gaps.push(`blocked lane: ${lane.name}${lane.note ? ` — ${lane.note}` : ""}`);
		if ((lane.status === "in_progress" || lane.status === "pending") && criticalPath.length < 6) {
			criticalPath.push(`${lane.status}:${lane.name}`);
		}
	}
	for (const checkpoint of mission.checkpoints) {
		const checkId = `check:${slug(checkpoint.name)}`;
		nodes.push({
			id: checkId,
			kind: "checkpoint",
			label: checkpoint.name,
			status: checkpoint.status,
			note: checkpoint.note,
		});
		taskTree.push({
			id: checkId,
			parentId: missionId,
			kind: "checkpoint",
			label: checkpoint.name,
			status: checkpoint.status,
			note: checkpoint.note,
		});
		edges.push({ from: missionId, to: checkId, kind: checkpoint.status === "blocked" ? "blocks" : "updates" });
		if (checkpoint.status !== "done")
			gaps.push(`${checkpoint.status} check: ${checkpoint.name}${checkpoint.note ? ` — ${checkpoint.note}` : ""}`);
	}
	const reverseHeavy = /native|pwn|malware|firmware|reverse|binary|exploit|mobile|proof_exit|bind_ready/i.test(
		JSON.stringify({ mission, nodes, gaps }),
	);
	if (reverseHeavy) {
		gaps.push("reverse runtime proof_exit capture pending");
		gaps.push("next: re_domain_proof_exit show");
		gaps.push("next: re_complete audit");
		gaps.push("next: re_runtime_adapter run");
		for (const node of nodes) {
			if (!node || typeof node !== "object") continue;
			const next = Array.isArray((node as any).next)
				? (node as any).next
				: Array.isArray((node as any).nextActions)
					? (node as any).nextActions
					: null;
			if (next) {
				for (const cmd of ["re_domain_proof_exit show", "re_complete audit", "re_runtime_adapter run"]) {
					if (!next.includes(cmd)) next.push(cmd);
				}
			}
		}
	}
	return { nodes, edges, taskTree, gaps, criticalPath };
}
