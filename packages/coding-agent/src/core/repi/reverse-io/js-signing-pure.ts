import type { ArtifactScopeFilterOptions } from "../artifact-scope.ts";
import { readCurrentMission } from "../mission.ts";
import { ensureReconStorage } from "../resources.ts";
import { prioritizeReverseProofLines } from "../reverse-capture.ts";
import { evidenceJsSigningDir } from "../storage.ts";
import {
	inferJsSigningTarget,
	type JsSigningArtifact,
	type JsSigningExecution,
	jsSigningShellCommand,
} from "../web-runtime/js-signing.ts";
import { latestScopedMarkdownArtifact } from "./shared.ts";

export function latestJsSigningArtifactPath(options: ArtifactScopeFilterOptions = {}): string | undefined {
	return latestScopedMarkdownArtifact("js_signing", evidenceJsSigningDir(), options);
}

export function buildJsSigningArtifact(options: {
	target?: string;
	url?: string;
	mode?: "plan" | "run";
	timeoutMs?: number;
	executions?: JsSigningExecution[];
	runtimeAnchors?: string[];
}): JsSigningArtifact {
	ensureReconStorage();
	const mission = readCurrentMission();
	const target = inferJsSigningTarget(options.target, options.url);
	const timeoutMs = Math.max(3000, Math.min(180000, Math.floor(options.timeoutMs ?? 15000)));
	const captureScript = jsSigningShellCommand(target, timeoutMs);
	const nextActions = Array.from(
		new Set(
			[
				target && (options.mode ?? "plan") !== "run" ? `re_js_signing run ${target} ${timeoutMs}` : undefined,
				"re_live_browser run <url>",
				"re_domain_proof_exit show",
				"re_complete audit",
				"re_runtime_adapter run",
			].filter((item): item is string => Boolean(item)),
		),
	).slice(0, 12);
	const runtimeAnchors = options.runtimeAnchors ?? [];
	return {
		timestamp: new Date().toISOString(),
		missionId: mission?.id,
		route: mission?.route?.domain,
		target,
		url: target && /^https?:\/\//i.test(target) ? target : undefined,
		mode: options.mode ?? "plan",
		timeoutMs,
		captureScript,
		executions: options.executions ?? [],
		runtimeAnchors,
		structuredSummary: prioritizeReverseProofLines(
			runtimeAnchors.filter(
				(line: any) =>
					typeof line === "string" &&
					(line.startsWith("summary.") ||
						line.startsWith("[runtime-technique]") ||
						line.startsWith("proof.exit=") ||
						line.startsWith("query.proof_exit=") ||
						line.startsWith("bind_ready=") ||
						line.startsWith("query.bind_ready=")),
			),
			48,
		),
		nextActions,
	};
}
