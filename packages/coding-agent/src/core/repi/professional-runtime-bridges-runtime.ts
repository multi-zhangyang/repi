/** Professional runtime bridge write/output + DI. */
import { join } from "node:path";
import type { ProfessionalRuntimeBridgesCheckV1 } from "./professional-runtime-bridges-data.ts";
import {
	buildProfessionalRuntimeBridgesGateFromIndex,
	formatProfessionalRuntimeBridgesGate,
} from "./professional-runtime-bridges-pure.ts";
import { ensureReconStorage } from "./resources.ts";
import { evidenceToolchainDir, writePrivateTextFile } from "./storage.ts";

export type ProfessionalBridgeRuntimeDeps = {
	parseToolIndex: (...args: any[]) => any;
	toolIndexPath: (...args: any[]) => any;
	indexedToolPresent: (...args: any[]) => any;
	buildToolDigest: (...args: any[]) => any;
	appendEvidence: (...args: any[]) => any;
	RECON_SYSTEM_PROMPT: string;
	RECON_APPEND_SYSTEM_PROMPT: string;
	PROFESSIONAL_RUNTIME_BRIDGE_MATRIX: unknown;
};

let professionalBridgeRuntimeDeps: ProfessionalBridgeRuntimeDeps | null = null;

export function configureProfessionalBridgeRuntime(deps: ProfessionalBridgeRuntimeDeps): void {
	professionalBridgeRuntimeDeps = deps;
}

function bd(): ProfessionalBridgeRuntimeDeps {
	if (!professionalBridgeRuntimeDeps) throw new Error("professional bridge runtime not configured");
	return professionalBridgeRuntimeDeps;
}

export function buildProfessionalRuntimeBridgesGate(bridgeFilter?: string): ProfessionalRuntimeBridgesCheckV1 {
	ensureReconStorage();
	const index = bd().parseToolIndex();
	const sourceCorpus = [
		bd().RECON_SYSTEM_PROMPT,
		bd().RECON_APPEND_SYSTEM_PROMPT,
		JSON.stringify(bd().PROFESSIONAL_RUNTIME_BRIDGE_MATRIX),
		bd().buildToolDigest(),
	].join("\n");
	return buildProfessionalRuntimeBridgesGateFromIndex({
		bridgeFilter,
		toolIndexPath: bd().toolIndexPath(),
		sourceCorpus,
		isToolPresent: (tool) => bd().indexedToolPresent(index, tool) === true,
	});
}

export function writeProfessionalRuntimeBridgesArtifact(report: ProfessionalRuntimeBridgesCheckV1): string {
	ensureReconStorage();
	const path = join(
		evidenceToolchainDir(),
		`${report.generatedAt.replace(/[:.]/g, "-")}-professional-runtime-bridges.md`,
	);
	writePrivateTextFile(
		path,
		`${formatProfessionalRuntimeBridgesGate(report, path)}\n\n## JSON\n\n\`\`\`json\n${JSON.stringify(report, null, 2)}\n\`\`\`\n`,
	);
	bd().appendEvidence({
		kind: "artifact",
		title: "professional-runtime-bridges",
		fact: `ProfessionalRuntimeBridgesCheckV1 bridges=${report.bridges.length} fallback=${report.closure.allFallbacksAvailable} executable=${report.closure.allHaveExecutableTemplates}`,
		command: "re_runtime_bridge show",
		path,
		verify: `cat ${path}`,
		confidence:
			"runtime:professional-runtime-bridges runtime_execution_bridge_matrix artifact_backed_tool_execution_plan env_ref_secret_boundary",
	});
	return path;
}

export function buildProfessionalRuntimeBridgeOutput(
	action: "show" | "refresh" = "show",
	bridgeFilter?: string,
): string {
	if (action === "refresh") return bd().buildToolDigest();
	const report = buildProfessionalRuntimeBridgesGate(bridgeFilter);
	const path = writeProfessionalRuntimeBridgesArtifact(report);
	return formatProfessionalRuntimeBridgesGate(report, path);
}
