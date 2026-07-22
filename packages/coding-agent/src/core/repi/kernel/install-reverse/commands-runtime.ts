import type { ExtensionAPI } from "../../../extensions/types.ts";
import type { CommandRegistrar, ReverseRuntimeToolDeps } from "./types.ts";

export function registerRepiReverseCaptureRuntimeCommands(
	registerCommand: CommandRegistrar,
	pi: ExtensionAPI,
	deps: ReverseRuntimeToolDeps,
): void {
	registerCommand("re-exploit-lab", {
		description:
			"Plan/show/run/bundle REPI exploit reliability lab: /re-exploit-lab [plan|show|run|bundle] [target] [runs] [timeout-ms]",
		handler: async (args: any) => {
			const parts = args.trim().split(/\s+/).filter(Boolean);
			const first = parts[0];
			const action =
				first === "show" || first === "run" || first === "bundle"
					? (parts.shift() as "show" | "run" | "bundle")
					: "plan";
			if (first === "plan") parts.shift();
			const maybeTimeout = parts.at(-1);
			const timeoutMs = maybeTimeout && /^\d+$/.test(maybeTimeout) ? Number(parts.pop()) : undefined;
			const maybeRuns = parts.at(-1);
			const runs = maybeRuns && /^\d+$/.test(maybeRuns) ? Number(parts.pop()) : undefined;
			const target = parts.join(" ") || undefined;
			const text =
				action === "run"
					? await deps.runExploitLab(pi, { target, runs, timeoutMs })
					: deps.buildExploitLabOutput(action, { target, runs, timeoutMs });
			deps.sendDisplayMessage(pi, "REPI Exploit Lab", text);
		},
	});

	registerCommand("re-mobile-runtime", {
		description:
			"Plan/show/run REPI mobile APK/Android Frida runtime capture: /re-mobile-runtime [plan|show|run] [target] [packageName] [timeout-ms]",
		handler: async (args: any) => {
			const parts = args.trim().split(/\s+/).filter(Boolean);
			const first = parts[0];
			const action = first === "show" || first === "run" ? (parts.shift() as "show" | "run") : "plan";
			if (first === "plan") parts.shift();
			const last = parts.at(-1);
			const timeoutMs = last && /^\d+$/.test(last) ? Number(parts.pop()) : undefined;
			const packageName =
				parts.length > 1 && /^[A-Za-z][\w]*(?:\.[A-Za-z][\w]*){1,}$/.test(parts.at(-1) ?? "")
					? parts.pop()
					: undefined;
			const target = parts.join(" ") || undefined;
			const text =
				action === "run"
					? await deps.runMobileRuntime(pi, { target, packageName, timeoutMs })
					: deps.buildMobileRuntimeOutput(action, { target, packageName, timeoutMs });
			deps.sendDisplayMessage(pi, "REPI Mobile Runtime", text);
		},
	});

	registerCommand("re-native-runtime", {
		description:
			"Plan/show/run REPI native ELF/SO GDB/Pwn runtime capture: /re-native-runtime [plan|show|run] [target] [timeout-ms]",
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
					? await deps.runNativeRuntime(pi, { target, timeoutMs })
					: deps.buildNativeRuntimeOutput(action, { target, timeoutMs });
			deps.sendDisplayMessage(pi, "REPI Native Runtime", text);
		},
	});
}
