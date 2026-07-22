/** Mission lane packs: web. */
import type { MissionLane } from "../types.ts";

export function lanes_web_api_pentest(): MissionLane[] {
	return [
		{
			name: "surface",
			objective: "映射 routes/auth/session/middleware/workers/storage",
			next: ["被动读代码和配置", "确认真实运行入口", "记录请求顺序"],
		},
		{
			name: "state",
			objective: "证明认证、授权或状态转换边界",
			next: ["最小 replay", "cookie/token/session diff", "状态变化证据"],
		},
		{ name: "poc", objective: "产出可复现 PoC", next: ["curl/httpie 脚本", "前后状态对照", "边界条件"] },
		{ name: "report", objective: "整理影响、证据和修复/下一步", next: ["证据块", "验证步骤", "memory 回写"] },
	];
}

export function lanes_web_pentest_scanning(): MissionLane[] {
	return [
		{
			name: "scope",
			objective: "确认目标 URL、主机、协议、指纹、robots/sitemap/OpenAPI/GraphQL 和扫描边界",
			next: ["curl/httpx baseline", "robots/sitemap", "WAF/header/tech fingerprint"],
		},
		{
			name: "crawl",
			objective: "构建 bounded route corpus、参数字典、静态资源和登录/未登录差异",
			next: ["katana/wayback fallback", "ffuf/gobuster small wordlist", "parameter candidates"],
		},
		{
			name: "template-scan",
			objective: "用 nuclei/nikto/dalfox/sqlmap 等工具产出候选发现队列，而不是直接声称漏洞成立",
			next: ["nuclei low-rate", "scanner JSONL", "triage severity/source"],
		},
		{
			name: "verify",
			objective: "对每个候选发现做 curl/HTTP replay、状态码/body hash/前后对照和误报裁剪",
			next: ["manual replay", "before/after hash", "false-positive notes"],
		},
		{
			name: "report",
			objective: "输出 finding queue、复现命令、证据 artifact 和后续深挖 lane",
			next: ["finding table", "replay verifier", "operator queue"],
		},
	];
}

export function lanes_frontend_js_reverse(): MissionLane[] {
	return [
		{
			name: "observe",
			objective: "捕获请求、initiator、参数和运行时差异",
			next: ["XHR/fetch/WS 观察", "sourcemap/webpack chunk", "hook args/return"],
		},
		{
			name: "rebuild",
			objective: "在 Node/浏览器外复现签名或加密链",
			next: ["抽取最小函数", "补环境", "first divergence patch"],
		},
		{
			name: "verify",
			objective: "用真实请求验证本地生成结果",
			next: ["replay", "对比字段", "记录时间戳/nonce 依赖"],
		},
		{ name: "report", objective: "写出复现脚本和关键断点", next: ["脚本", "证据块", "field journal"] },
	];
}
