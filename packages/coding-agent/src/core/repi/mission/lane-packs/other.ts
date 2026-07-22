/** Mission lane packs: other. */
import type { MissionLane } from "../types.ts";

export function lanes_agent_llm_boundary(): MissionLane[] {
	return [
		{
			name: "surface",
			objective: "映射 system/developer/user/tool/memory/RAG/MCP 输入边界和不可信内容入口",
			next: ["prompt/resource inventory", "tool schema map", "untrusted content flow"],
		},
		{
			name: "tool-boundary",
			objective: "证明工具调用、shell/API 参数、schema 校验、审批和输出回灌边界",
			next: ["registerTool/exec map", "argument validation", "tool output trust boundary"],
		},
		{
			name: "memory",
			objective: "确认长期记忆、检索、向量库、日志和 playbook 的投毒/污染路径",
			next: ["memory stores", "retrieval filters", "poison payload replay"],
		},
		{
			name: "injection",
			objective: "构造间接 prompt injection / tool injection replay harness 并记录最小复现",
			next: ["payload corpus", "replay transcript", "boundary decision proof"],
		},
		{
			name: "delegation",
			objective: "追踪 MCP/resource/sub-agent/delegation 链路和权限漂移边",
			next: ["MCP resources", "sub-agent handoff", "capability drift"],
		},
		{
			name: "report",
			objective: "沉淀 agent 边界图、可复现注入链和工具调用证据",
			next: ["boundary graph", "replay command", "evidence block"],
		},
	];
}

export function lanes_default(route: { workflow: string[] }): MissionLane[] {
	return [
		{ name: "map", objective: "被动映射入口、配置、资产和证据面", next: route.workflow.slice(0, 2) },
		{ name: "prove", objective: "证明一条最小端到端路径", next: route.workflow.slice(2, 4) },
		{ name: "expand", objective: "只在最小路径成立后横向扩展", next: ["换证据面", "补工具链", "验证边界"] },
		{ name: "report", objective: "输出证据块、复现命令、下一步和记忆", next: ["report", "diagram", "field journal"] },
	];
}
