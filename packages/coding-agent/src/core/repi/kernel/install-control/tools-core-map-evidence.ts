/** Lean product control-plane tools group. */
import { Type } from "typebox";
import type { ExtensionAPI } from "../../../extensions/types.ts";
import { truncateMiddle } from "../../text.ts";
import type { ControlPlaneToolDeps } from "./tools-deps.ts";

type ToolRegistrar = (tool: Parameters<ExtensionAPI["registerTool"]>[0]) => void;

export function registerRepiControlCoreMapEvidenceTools(
	registerTool: ToolRegistrar,
	pi: ExtensionAPI,
	deps: ControlPlaneToolDeps,
): void {
	registerTool({
		name: "re_map",
		label: "RE Map",
		description:
			"Run a passive target/workspace mapper, write a map artifact, append evidence, and satisfy the passive_map_done checkpoint.",
		promptSnippet: "Use re_map before broad exploitation to anchor files/routes/configs/binaries in evidence.",
		promptGuidelines: [
			"Call re_map early for reverse/pentest tasks to capture target stat, manifests, routes/auth strings, binary candidates, and HTTP baseline when applicable.",
			"Use the generated map_artifact path as the source of truth for subsequent lane command packs.",
		],
		parameters: Type.Object({
			target: Type.Optional(Type.String()),
			depth: Type.Optional(Type.Number()),
		}),
		async execute(_toolCallId, params: any, _signal?: any, _onUpdate?: any, _ctx?: any) {
			const text = await deps.runPassiveMap(pi, { target: params.target, depth: params.depth });
			return {
				content: [{ type: "text" as const, text: truncateMiddle(text, 16000) }],
				details: { path: deps.evidenceMapsDir(), target: params.target ?? "." } as Record<string, unknown>,
			};
		},
	});
	registerTool({
		name: "re_evidence",
		label: "RE Evidence",
		description:
			"Append, search, or show REPI evidence with runtime-first priority metadata. Requires reverse proof.exit=partial_runtime_capture|runtime_capture_strong and bind_ready=true before claim.",
		promptSnippet: "Record decisive evidence in a ledger before making claims.",
		promptGuidelines: [
			"Use re_evidence append for runtime behavior, traffic, served assets, process config, artifacts, source, and operator notes.",
			"Prefer P1/P2 evidence over source names or comments when evidence conflicts.",
			"Reverse claims stay blocked until proof.exit=partial_runtime_capture|runtime_capture_strong.",
		],
		parameters: Type.Object({
			action: Type.Union([Type.Literal("show"), Type.Literal("append"), Type.Literal("search")]),
			kind: Type.Optional(
				Type.Union([
					Type.Literal("runtime"),
					Type.Literal("traffic"),
					Type.Literal("served_asset"),
					Type.Literal("process_config"),
					Type.Literal("artifact"),
					Type.Literal("source"),
					Type.Literal("note"),
				]),
			),
			title: Type.Optional(Type.String()),
			fact: Type.Optional(Type.String()),
			command: Type.Optional(Type.String()),
			path: Type.Optional(Type.String()),
			offset: Type.Optional(Type.String()),
			hash: Type.Optional(Type.String()),
			verify: Type.Optional(Type.String()),
			confidence: Type.Optional(Type.String()),
			query: Type.Optional(Type.String()),
		}),
		async execute(_toolCallId, params: any, _signal?: any, _onUpdate?: any, _ctx?: any) {
			if (params.action === "append") {
				const evidence = deps.appendEvidence({
					kind: params.kind ?? "note",
					title: params.title ?? "agent evidence",
					fact: params.fact ?? "",
					command: params.command,
					path: params.path,
					offset: params.offset,
					hash: params.hash,
					verify: params.verify,
					confidence: params.confidence,
				});
				return {
					content: [
						{
							type: "text" as const,
							text: `Appended evidence: P${evidence.priority} ${evidence.kind} ${evidence.title}`,
						},
					],
					details: evidence as unknown as Record<string, unknown>,
				};
			}
			return {
				content: [
					{
						type: "text" as const,
						text: deps.buildEvidenceDigest(params.action === "search" ? params.query : undefined),
					},
				],
				details: { path: deps.evidenceLedgerPath(), action: params.action },
			};
		},
	});
}
