/** Mission lane packs: lanes_exploit_reliability. */
import type { MissionLane } from "../types.ts";

export function lanes_exploit_reliability(): MissionLane[] {
	return [
		{
			name: "inventory",
			objective: "枚举 PoC、payload、replay 脚本、环境假设和目标绑定",
			next: ["PoC candidates", "target/env pins", "input/output contract"],
		},
		{
			name: "normalize",
			objective: "把一次性 PoC 规范化为可参数化、可记录、可回放的 runner",
			next: ["argument contract", "timeout/output hash", "artifact paths"],
		},
		{
			name: "replay",
			objective: "多轮执行 replay matrix，量化成功率、耗时、输出漂移和失败类型",
			next: ["N-run matrix", "success rate", "stdout/stderr hashes"],
		},
		{
			name: "flake-triage",
			objective: "定位 ASLR、race、timeout、IO、网络、libc/loader 环境差异导致的不稳定",
			next: ["failure buckets", "env diff", "retry/backoff"],
		},
		{
			name: "bundle",
			objective: "打包可复现 exploit artifact、环境 pin、运行矩阵和验证摘要",
			next: ["manifest", "runbook", "evidence graph"],
		},
		{
			name: "report",
			objective: "输出稳定性结论、复现命令、失败边界和下一步强化计划",
			next: ["replay stats", "known flakes", "operator command"],
		},
	];
}
