import type { ExtensionAPI } from "../../../extensions/types.ts";
import type { CommandRegistrar, ReverseRuntimeToolDeps } from "./types.ts";

export function registerRepiReverseBrowserCommands(
	registerCommand: CommandRegistrar,
	pi: ExtensionAPI,
	deps: ReverseRuntimeToolDeps,
): void {
	registerCommand("re-live-browser", {
		description:
			"Plan/show/run REPI browser/XHR/WS runtime capture: /re-live-browser [plan|show|run] [url] [timeout-ms]",
		handler: async (args: any) => {
			const parts = args.trim().split(/\s+/).filter(Boolean);
			const first = parts[0];
			const action = first === "show" || first === "run" ? (parts.shift() as "show" | "run") : "plan";
			if (first === "plan") parts.shift();
			const last = parts.at(-1);
			const timeoutMs = last && /^\d+$/.test(last) ? Number(parts.pop()) : undefined;
			const target = parts.join(" ") || undefined;
			const text =
				action === "run"
					? await deps.runLiveBrowser(pi, { target, timeoutMs })
					: deps.buildLiveBrowserOutput(action, { target, timeoutMs });
			deps.sendDisplayMessage(pi, "REPI Live Browser", text);
		},
	});

	registerCommand("re-web-authz-state", {
		description:
			"Plan/show/run REPI Web/API authz state machine capture: /re-web-authz-state [plan|show|run] [url] [timeout-ms]",
		handler: async (args: any) => {
			const parts = args.trim().split(/\s+/).filter(Boolean);
			const first = parts[0];
			const action = first === "show" || first === "run" ? (parts.shift() as "show" | "run") : "plan";
			if (first === "plan") parts.shift();
			const last = parts.at(-1);
			const timeoutMs = last && /^\d+$/.test(last) ? Number(parts.pop()) : undefined;
			const target = parts.join(" ") || undefined;
			const text =
				action === "run"
					? await deps.runWebAuthzState(pi, { target, timeoutMs })
					: deps.buildWebAuthzStateOutput(action, { target, timeoutMs });
			deps.sendDisplayMessage(pi, "REPI Web Authz State", text);
		},
	});

	registerCommand("re-js-signing", {
		description:
			"Plan/show/run REPI JS signing reverse capture: /re-js-signing [plan|show|run] [url-or-bundle] [timeout-ms]",
		handler: async (args: any) => {
			const parts = args.trim().split(/\s+/).filter(Boolean);
			const first = parts[0];
			const action = first === "show" || first === "run" ? (parts.shift() as "show" | "run") : "plan";
			if (first === "plan") parts.shift();
			const last = parts.at(-1);
			const timeoutMs = last && /^\d+$/.test(last) ? Number(parts.pop()) : undefined;
			const target = parts.join(" ") || undefined;
			const text =
				action === "run"
					? await deps.runJsSigning(pi, { target, timeoutMs })
					: deps.buildJsSigningOutput(action, { target, timeoutMs });
			deps.sendDisplayMessage(pi, "REPI JS Signing", text);
		},
	});
}
