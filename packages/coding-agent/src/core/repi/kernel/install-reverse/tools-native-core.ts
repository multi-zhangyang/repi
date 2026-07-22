/** Reverse install tool: re_native_runtime. */
import { Type } from "typebox";
import type { ExtensionAPI } from "../../../extensions/types.ts";
import { truncateMiddle } from "../../text.ts";
import type { ReverseRuntimeToolDeps, ToolRegistrar } from "./types.ts";

export function registerRepiReverseNativeTool(
	registerTool: ToolRegistrar,
	pi: ExtensionAPI,
	deps: ReverseRuntimeToolDeps,
): void {
	registerTool({
		name: "re_native_runtime",
		label: "RE Native Runtime",
		description:
			"Plan, show, or run native ELF/SO runtime capture with binary inventory, mitigations, loader/libc map, symbols, GDB trace, crash/register anchors, and pwntools scaffold.",
		promptSnippet:
			"Use re_native_runtime for ELF/SO/Pwn/native reverse tasks after re_map or before claiming crash offsets, libc/loader behavior, GDB trace, or exploit primitive state.",
		promptGuidelines: [
			"Call re_native_runtime run for native targets (plan only if inventory-only) to generate binary inventory, mitigation matrix, breakpoint plan, and artifact contract.",
			"Call re_native_runtime run with a concrete ELF/SO to capture tool readiness, checksec/readelf/ldd/symbol anchors, GDB script, and pwn scaffold.",
		],
		parameters: Type.Object({
			action: Type.Optional(Type.Union([Type.Literal("plan"), Type.Literal("show"), Type.Literal("run")])),
			target: Type.Optional(Type.String()),
			timeoutMs: Type.Optional(Type.Number()),
		}),
		async execute(_toolCallId, params: any, _signal?: any, _onUpdate?: any, _ctx?: any) {
			const action = params.action ?? "plan";
			const text =
				action === "run"
					? await deps.runNativeRuntime(pi, { target: params.target, timeoutMs: params.timeoutMs })
					: deps.buildNativeRuntimeOutput(action, { target: params.target, timeoutMs: params.timeoutMs });
			return {
				content: [{ type: "text" as const, text: truncateMiddle(text, 20000) }],
				details: { action, path: deps.latestNativeRuntimeArtifactPath(), target: params.target } as Record<
					string,
					unknown
				>,
			};
		},
	});
}
