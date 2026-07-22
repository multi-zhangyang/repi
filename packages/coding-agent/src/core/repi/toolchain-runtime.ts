/**
 * Toolchain domain capability product wrappers (index + artifact I/O).
 */
import { join } from "node:path";
import {
	buildToolchainDomainCapabilityFromIndex,
	formatToolchainDomainCapability,
	TOOLCHAIN_DOMAIN_CAPABILITY_MATRIX,
	type ToolchainDomainCapabilityV1,
} from "./kernel/toolchain-domain-matrix.ts";
import { ensureReconStorage, RECON_APPEND_SYSTEM_PROMPT, RECON_SYSTEM_PROMPT } from "./resources.ts";
import { toolIndexPath } from "./storage/paths/core.ts";
import { evidenceToolchainDir, writePrivateTextFile } from "./storage.ts";
import { buildToolDigest, createBootstrapPlan, parseToolIndex } from "./tool-index.ts";
import { repiIndexedToolPresent } from "./tool-presence.ts";

export type ToolchainRuntimeDeps = {
	appendEvidence: (...args: any[]) => any;
};

let toolchainRuntimeDeps: ToolchainRuntimeDeps | null = null;

export function configureToolchainRuntime(deps: ToolchainRuntimeDeps): void {
	toolchainRuntimeDeps = deps;
}

function d(): ToolchainRuntimeDeps {
	if (!toolchainRuntimeDeps)
		throw new Error("toolchain-runtime not configured; call configureToolchainRuntime() from REPI kernel init");
	return toolchainRuntimeDeps;
}

function appendEvidence(...args: any[]): any {
	return d().appendEvidence(...args);
}

export function buildToolchainDomainCapability(domainFilter?: string): ToolchainDomainCapabilityV1 {
	ensureReconStorage();
	const index = parseToolIndex();
	const sourceCorpus = [
		RECON_SYSTEM_PROMPT,
		RECON_APPEND_SYSTEM_PROMPT,
		JSON.stringify(TOOLCHAIN_DOMAIN_CAPABILITY_MATRIX),
		buildToolDigest(),
	].join("\n");
	return buildToolchainDomainCapabilityFromIndex({
		domainFilter,
		toolIndexPath: toolIndexPath(),
		sourceCorpus,
		isToolPresent: (tool) => repiIndexedToolPresent(index, tool) === true,
		recommendInstall: (tools) =>
			createBootstrapPlan(tools).map((item: any) =>
				item.known ? `re_bootstrap plan ${item.tool}` : `manual_tool_review ${item.tool}`,
			),
	});
}

export function writeToolchainDomainCapabilityArtifact(report: ToolchainDomainCapabilityV1): string {
	ensureReconStorage();
	const path = join(
		evidenceToolchainDir(),
		`${report.generatedAt.replace(/[:.]/g, "-")}-toolchain-domain-capability.md`,
	);
	const body = [
		formatToolchainDomainCapability(report),
		"",
		"## JSON",
		"",
		"```json",
		JSON.stringify(report, null, 2),
		"```",
		"",
	].join("\n");
	writePrivateTextFile(path, body);
	appendEvidence({
		kind: "artifact",
		title: "toolchain-domain-capability",
		fact: `ToolchainDomainCapabilityV1 ready=${report.coverage.readyCount} degraded=${report.coverage.degradedCount} blocked=${report.coverage.blockedCount}`,
		command: "re_toolchain_domain show",
		path,
		verify: `cat ${path}`,
		confidence: "runtime:toolchain-doctor domain_toolchain_matrix fallback_available critical_gap",
	});
	return path;
}

export { formatToolchainDomainCapability };
export function buildToolchainDomainCapabilityOutput(
	action: "show" | "refresh" = "show",
	domainFilter?: string,
): string {
	if (action === "refresh") return buildToolDigest();
	const report = buildToolchainDomainCapability(domainFilter);
	const path = writeToolchainDomainCapabilityArtifact(report);
	return formatToolchainDomainCapability(report, path);
}
