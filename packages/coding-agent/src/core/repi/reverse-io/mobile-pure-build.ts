/** Build mobile runtime artifact (reverse plan/run). */

import { readCurrentMission } from "../mission.ts";
import { ensureReconStorage } from "../resources.ts";
import type { MobileRuntimeArtifact, MobileRuntimeExecution } from "../reverse-runtime.ts";
import { mobileRuntimeShellCommand } from "../reverse-runtime.ts";
import { evidenceMapsDir, evidenceRunsDir, recentMarkdownArtifacts } from "../storage.ts";
import { latestLiveBrowserArtifactPath } from "./browser-pure.ts";
import { buildMobileRuntimePlanSections } from "./mobile-pure-build-plan.ts";
import { inferMobilePackageName } from "./mobile-pure-path.ts";
import { latestCompilerArtifactPath, latestVerifierArtifactPath } from "./shared-deps.ts";

export function buildMobileRuntimeArtifact(options: {
	target?: string;
	packageName?: string;
	mode?: "plan" | "run";
	timeoutMs?: number;
	executions?: MobileRuntimeExecution[];
	runtimeAnchors?: string[];
}): MobileRuntimeArtifact {
	ensureReconStorage();
	const mission = readCurrentMission();
	const target = options.target?.trim() || undefined;
	const packageName = inferMobilePackageName(target, options.packageName);
	const dynamicOnly = Boolean(packageName && !target);
	const timeoutMs = Math.max(3000, Math.min(180000, Math.floor(options.timeoutMs ?? 15000)));
	const captureScript = mobileRuntimeShellCommand(target, packageName, timeoutMs);
	const plan = buildMobileRuntimePlanSections({ target, packageName, timeoutMs, dynamicOnly });
	return {
		timestamp: new Date().toISOString(),
		missionId: mission?.id,
		route: mission?.route.domain,
		target,
		packageName,
		mode: options.mode ?? "plan",
		timeoutMs,
		captureScript,
		...plan,
		executions: options.executions ?? [],
		runtimeAnchors: options.runtimeAnchors ?? [],
		structuredSummary: (options.runtimeAnchors ?? [])
			.filter((line: string) => line.startsWith("summary.") || line.startsWith("[runtime-technique]"))
			.slice(0, 40),
		sourceArtifacts: [
			recentMarkdownArtifacts(evidenceMapsDir(), 1)[0],
			recentMarkdownArtifacts(evidenceRunsDir(), 1)[0],
			latestLiveBrowserArtifactPath(),
			latestVerifierArtifactPath(),
			latestCompilerArtifactPath(),
		].filter((path): path is string => Boolean(path)),
	};
}
