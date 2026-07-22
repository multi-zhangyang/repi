/** Delegate output/show with reverse runtime capture gate. */

import type { OperationArtifact } from "../campaign-runtime.ts";
import {
	buildOperation,
	latestOperationArtifactPath,
	parseOperationArtifact,
	writeOperationArtifact,
} from "../campaign-runtime.ts";
import { formatDelegate } from "../operator-format.ts";
import { reverseDomainCaptureNextCommands } from "../reverse-capture.ts";
import { readTextFile as readText } from "../storage.ts";
import { truncateMiddle } from "../text.ts";
import { buildDelegate, latestDelegateArtifactPath, writeDelegateArtifact } from "./build-core.ts";
import type { DelegateArtifact } from "./types.ts";

export function buildDelegateOutput(
	action: "plan" | "show" | "merge" = "plan",
	options: { target?: string; task?: string } = {},
): string {
	if (action === "show") {
		const path = latestDelegateArtifactPath();
		if (!path) return "delegation_plan:\nstatus: missing\nnext: re_delegate plan";
		return truncateMiddle(readText(path), 16000);
	}
	const delegate = buildDelegate({ ...options, mode: action === "merge" ? "merge" : "plan" });
	const path = writeDelegateArtifact(delegate);
	const mergeSummary =
		action === "merge"
			? [
					"",
					"merge_summary:",
					`- packets: ${delegate.packets.length}`,
					`- ready: ${delegate.packets.filter((packet: any) => packet.status === "ready").length}`,
					`- done: ${delegate.packets.filter((packet: any) => packet.status === "done").length}`,
					`- blocked: ${delegate.packets.filter((packet: any) => packet.status === "blocked").length}`,
				].join("\n")
			: "";
	const reverseWorkers = delegate.packets.some((packet: any) =>
		/native-runtime|pwn-exploit|mobile-runtime|web-authz|firmware-dfir|malware/i.test(packet.worker),
	);
	const reverseGate = reverseWorkers
		? [
				"",
				"reverse_runtime_capture_gate:",
				"- require proof.exit=partial_runtime_capture|runtime_capture_strong",
				"- require bind_ready=true before claim",
				...reverseDomainCaptureNextCommands({
					routeOrBlob: delegate.packets
						.map((packet: any) => `${packet.worker} ${packet.objective ?? ""}`)
						.join("\n"),
					target: delegate.target,
				})
					.slice(0, 4)
					.map((cmd: any) => `- next: ${cmd}`),
				"- next: re_domain_proof_exit show",
				"- next: re_complete audit",
			].join("\n")
		: "";
	return `${formatDelegate(delegate, path)}${mergeSummary}${reverseGate}`;
}

export function parseDelegateArtifact(path: string): DelegateArtifact | undefined {
	const match = /```json\s*([\s\S]*?)\s*```/m.exec(readText(path));
	if (!match?.[1]) return undefined;
	try {
		return JSON.parse(match[1]) as DelegateArtifact;
	} catch {
		return undefined;
	}
}

export function latestOrBuildDelegate(options: { target?: string; task?: string } = {}): {
	delegate: DelegateArtifact;
	path: string;
} {
	const latest = !options.target && !options.task ? latestDelegateArtifactPath() : undefined;
	if (latest) {
		const delegate = parseDelegateArtifact(latest);
		if (delegate) return { delegate, path: latest };
	}
	const delegate = buildDelegate({ target: options.target, task: options.task, mode: "plan" });
	const path = writeDelegateArtifact(delegate);
	return { delegate, path };
}

export function latestOrBuildOperation(options: { target?: string; task?: string } = {}): {
	operation: OperationArtifact;
	path: string;
} {
	const latest = !options.target && !options.task ? latestOperationArtifactPath() : undefined;
	if (latest) {
		const operation = parseOperationArtifact(latest);
		if (operation) return { operation, path: latest };
	}
	const operation = buildOperation({ target: options.target, task: options.task, mode: "plan" });
	const path = writeOperationArtifact(operation);
	return { operation, path };
}
