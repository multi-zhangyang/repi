/** Operation reverse steps: browser/web-authz/mobile (run-first). */
import type { ExtensionAPI } from "../extensions/types.ts";
import { d } from "./operation-step-deps.ts";
import type { OperationExecution } from "./operator-step.ts";

type Done = (output: string) => OperationExecution;

export async function tryExecuteOperationReverseWebStep(
	pi: ExtensionAPI,
	command: string,
	target: string | undefined,
	done: Done,
): Promise<OperationExecution | undefined> {
	const liveBrowserMatch = /^re[-_]live[-_]browser\s+(plan|show|run)?(?:\s+(.+?))?(?:\s+(\d+))?$/i.exec(command);
	if (liveBrowserMatch) {
		const action = (liveBrowserMatch[1] as "plan" | "show" | "run") ?? "run";
		const browserTarget = liveBrowserMatch[2]?.trim() || target;
		const timeoutMs = liveBrowserMatch[3] ? Number(liveBrowserMatch[3]) : undefined;
		return done(
			action === "run"
				? await d().runLiveBrowser(pi, { target: browserTarget, timeoutMs })
				: d().buildLiveBrowserOutput(action, { target: browserTarget, timeoutMs }),
		);
	}
	const webAuthzStateMatch = /^re[-_]web[-_]authz[-_]state\s+(plan|show|run)?(?:\s+(.+?))?(?:\s+(\d+))?$/i.exec(
		command,
	);
	if (webAuthzStateMatch) {
		const action = (webAuthzStateMatch[1] as "plan" | "show" | "run") ?? "run";
		const authzTarget = webAuthzStateMatch[2]?.trim() || target;
		const timeoutMs = webAuthzStateMatch[3] ? Number(webAuthzStateMatch[3]) : undefined;
		return done(
			action === "run"
				? await d().runWebAuthzState(pi, { target: authzTarget, timeoutMs })
				: d().buildWebAuthzStateOutput(action, { target: authzTarget, timeoutMs }),
		);
	}
	const mobileRuntimeMatch =
		/^re[-_]mobile[-_]runtime\s+(plan|show|run)?(?:\s+(.+?))?(?:\s+([A-Za-z][\w]*(?:\.[A-Za-z][\w]*){1,}))?(?:\s+(\d+))?$/i.exec(
			command,
		);
	if (mobileRuntimeMatch) {
		const action = (mobileRuntimeMatch[1] as "plan" | "show" | "run") ?? "run";
		const mobileTarget = mobileRuntimeMatch[2]?.trim() || target;
		const packageName = mobileRuntimeMatch[3]?.trim();
		const timeoutMs = mobileRuntimeMatch[4] ? Number(mobileRuntimeMatch[4]) : undefined;
		return done(
			action === "run"
				? await d().runMobileRuntime(pi, { target: mobileTarget, packageName, timeoutMs })
				: d().buildMobileRuntimeOutput(action, { target: mobileTarget, packageName, timeoutMs }),
		);
	}
	return undefined;
}
