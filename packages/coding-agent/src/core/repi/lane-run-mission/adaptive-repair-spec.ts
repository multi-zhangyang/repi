/** Adaptive repair lane specs for weak evidence / missing tools / map refresh. */
import { shellQuote } from "../target.ts";
import { metadataValue, toolIndexPath } from "./deps.ts";
import { splitMetadataList } from "./helpers.ts";

export function adaptiveRepairLaneSpec(params: { lane: any; decision: any; text: string; target?: string }): {
	name: string;
	objective: string;
	next: string[];
	blockCurrent: boolean;
} {
	const missingTools = splitMetadataList(metadataValue(params.text, "missing_tools"));
	const target = params.target ? shellQuote(params.target) : undefined;
	if (/tool_strategy|skipped_without_fallback/.test(params.decision.reason)) {
		const tools = missingTools.length ? missingTools.slice(0, 12) : ["checksec", "gdb", "r2", "rabin2"];
		return {
			name: "tool-bootstrap",
			objective: "补齐缺失工具或确认可用替代路径，再回到被阻塞 lane",
			blockCurrent: true,
			next: [
				`re_bootstrap plan ${tools.join(" ")}`,
				`[auto:tool-presence-audit] for t in ${tools.map((tool: any) => shellQuote(tool)).join(" ")}; do printf '%s=' "$t"; command -v "$t" || true; done # evidence: missing tool availability audit`,
				`[auto:tool-index-tail] sed -n '1,220p' ${shellQuote(toolIndexPath())} 2>/dev/null || true # evidence: current tool-index evidence`,
			],
		};
	}
	if (/no_adaptive_followup|weak_evidence|partial_evidence/.test(params.decision.reason)) {
		return {
			name: "evidence-repair",
			objective: "当前 lane 证据质量不足；扩大最小证据面并生成可运行 follow-up",
			blockCurrent: false,
			next: [
				target
					? `[auto:repair-target-baseline] file ${target}; sha256sum ${target}; strings -a -n 5 ${target} | grep -iE 'license|serial|key|valid|invalid|check|verify|flag|pass|fail|strcmp|memcmp|auth|token|sign' | head -220 # evidence: target baseline and high-signal strings`
					: "[auto:repair-target-discovery] pwd; find . -maxdepth 4 -type f | sort | head -260 # evidence: target candidate discovery",
				'[auto:repair-signal-sweep] rg -n "license|serial|key|valid|invalid|check|verify|flag|strcmp|memcmp|auth|session|jwt|sign|crypto|token|secret|admin|debug" . 2>/dev/null | head -260 # evidence: widened high-signal search',
				"[auto:repair-entry-map] find . -maxdepth 4 -type f \\( -name 'package.json' -o -name 'Dockerfile*' -o -name 'docker-compose*.yml' -o -name '*.service' -o -name '*route*' -o -name '*controller*' \\) | sort | head -180 # evidence: entry/config/route candidates",
			],
		};
	}
	return {
		name: "map-refresh",
		objective: "当前自动链没有稳定推进；刷新被动地图并重新选择证据面",
		blockCurrent: false,
		next: [
			"[auto:map-refresh-inventory] pwd; find . -maxdepth 5 -type f | sort | head -300 # evidence: refreshed workspace inventory",
			'[auto:map-refresh-routes] rg -n "route|router|auth|session|jwt|license|serial|flag|verify|sign|crypto|token|secret|admin|debug" . 2>/dev/null | head -260 # evidence: refreshed route/logic anchors',
		],
	};
}
