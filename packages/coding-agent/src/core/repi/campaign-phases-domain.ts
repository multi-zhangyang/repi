/** Campaign phases for web/identity/cloud/recon domains. */

import { createCampaignPhaseFactory } from "./campaign-phases-factory.ts";
import { textHasAny } from "./campaign-phases-helpers.ts";
import type { CampaignPhase } from "./domain-proof-exit/types.ts";
import type { MissionState } from "./mission.ts";

export function buildCampaignDomainPhases(
	mission: MissionState | undefined,
	map: any,
	targetRef: string,
	taskText: string,
	toolGaps: string[],
	sourceArtifacts: string[],
): Array<CampaignPhase | undefined> {
	const mkPhase = createCampaignPhaseFactory(mission, map, toolGaps, sourceArtifacts);
	return [
		mkPhase(
			"recon-map",
			"建立目标/工作区被动地图，确认入口、配置、路由、二进制/样本/云身份与证据面",
			mission?.route.domain ?? "Security routing",
			true,
			["passive map artifact", "tool index", "target fingerprint"],
			[/map|surface|triage|inventory|identity/i],
			[`re_decision_core tick ${targetRef}`, `re_map ${targetRef} 3`, "re_tool_index refresh", "re_graph build"],
		),
		mkPhase(
			"web-authz",
			"把 Web/API/GraphQL/WebSocket 的认证、授权、对象所有权和状态转换证明成可 replay 的最小路径",
			"Web / API pentest",
			mission?.route.domain === "Web / API pentest" ||
				textHasAny(taskText, [/\bapi\b|websocket|graphql|jwt|oauth|idor|bola|session|cookie|csrf/i]),
			["browser/XHR/WS capture", "auth matrix", "IDOR/BOLA or authz-state evidence", "replay command"],
			[/surface|state|poc|auth|web|api/i],
			[
				`re_live_browser run ${targetRef}`,
				`re_web_authz_state run ${targetRef}`,
				`re_lane plan surface ${targetRef}`,
				`re_lane run surface ${targetRef}`,
				`re_lane plan state ${targetRef}`,
				`re_web_authz_state run ${targetRef} 9000`,
				"re_graph build",
			],
		),
		mkPhase(
			"credential-identity",
			"验证 cookie/JWT/API key/ticket/hash/serviceaccount 的可用性、作用域、过期和可转移边界",
			"Identity / credentials",
			mission?.route.domain === "Identity / Windows / AD" ||
				textHasAny(taskText, [
					/credential|凭据|token|jwt|cookie|kerberos|ntlm|ldap|spn|ticket|hash|serviceaccount/i,
				]),
			["credential inventory", "usable credential proof", "principal/scope evidence", "negative control"],
			[/credential|principal|identity|state|metadata/i],
			[
				`re_lane plan credentials ${targetRef}`,
				`re_lane run credentials ${targetRef}`,
				`re_lane plan principals ${targetRef}`,
			],
		),
		mkPhase(
			"cloud-container",
			"从运行配置、serviceaccount、metadata、IAM/RBAC 到最小 privilege edge 组织云/容器 pivot",
			"Cloud / container",
			mission?.route.domain === "Cloud / container" ||
				textHasAny(taskText, [
					/cloud|aws|azure|gcp|metadata|k8s|kubernetes|docker|container|rbac|iam|serviceaccount/i,
				]),
			["runtime config", "cloud identity", "metadata probe", "privilege edge"],
			[/identity|runtime-config|metadata|privilege|cloud|container/i],
			[
				`re_lane plan identity ${targetRef}`,
				`re_lane run identity ${targetRef}`,
				`re_lane plan privilege ${targetRef}`,
			],
		),
	];
}
