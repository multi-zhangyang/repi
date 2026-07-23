/** Reverse install tool: re_toolchain_domain. */
import { Type } from "typebox";
import type { ExtensionAPI } from "../../../extensions/types.ts";
import type { ReverseRuntimeToolDeps, ToolRegistrar } from "./types.ts";

export function registerRepiToolchainDomainTool(
	registerTool: ToolRegistrar,
	pi: ExtensionAPI,
	deps: ReverseRuntimeToolDeps,
): void {
	registerTool({
		name: "re_toolchain_domain",
		label: "RE Toolchain Domain Capability",
		description:
			"Inspect REPI professional reverse/pentest domain capability matrix with runtime tool-index evidence, fallbacks, proof exits, and next commands.",
		promptSnippet:
			"Use re_toolchain_domain to choose concrete domain tools and fallbacks before claiming a route is blocked.",
		promptGuidelines: [
			"Call re_toolchain_domain show when a reverse/pentest task feels under-tooled or too generic.",
			"Use domain nextRuntimeCommands and recommendedInstallHints to drive re_lane/re_bootstrap rather than narrative-only advice.",
		],
		parameters: Type.Object({
			action: Type.Optional(Type.Union([Type.Literal("show"), Type.Literal("refresh")])),
			domain: Type.Optional(Type.String()),
		}),
		async execute(_toolCallId, params: any, _signal?: any, _onUpdate?: any, _ctx?: any) {
			const action = params.action ?? "show";
			if (action === "refresh") await deps.refreshToolIndex(pi);
			const report = deps.buildToolchainDomainCapability(params.domain);
			const path = deps.writeToolchainDomainCapabilityArtifact(report);
			return {
				content: [
					{
						type: "text" as const,
						text: deps.truncateMiddle(deps.formatToolchainDomainCapability(report, path), 20000),
					},
				],
				details: { action, domain: params.domain, path, coverage: report.coverage } as Record<string, unknown>,
			};
		},
	});
}
