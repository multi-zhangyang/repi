/** Runtime adapter execution gate + artifact write. */
import { join } from "node:path";
import { ensureReconStorage } from "./resources.ts";
import {
	buildRuntimeAdapterExecutionGate as buildRuntimeAdapterExecutionGateReport,
	formatRuntimeAdapterExecutionGate,
	type RuntimeAdapterExecutionCheckV1,
} from "./runtime-adapter.ts";
import { appendEvidence, parseToolIndex } from "./runtime-adapter-exec-deps.ts";
import { evidenceToolchainDir, toolIndexPath, writePrivateTextFile } from "./storage.ts";
import { repiResolvedToolPresent as resolvedToolPresent } from "./tool-presence.ts";

export function buildRuntimeAdapterExecutionGate(adapterFilter?: string): RuntimeAdapterExecutionCheckV1 {
	ensureReconStorage();
	const index = parseToolIndex();
	return buildRuntimeAdapterExecutionGateReport(adapterFilter, {
		toolIndexPath: toolIndexPath(),
		isToolPresent: (tool) => resolvedToolPresent(index, tool),
	});
}

export function writeRuntimeAdapterExecutionArtifact(report: RuntimeAdapterExecutionCheckV1): string {
	ensureReconStorage();
	const path = join(
		evidenceToolchainDir(),
		`${report.generatedAt.replace(/[:.]/g, "-")}-runtime-adapter-execution.md`,
	);
	writePrivateTextFile(
		path,
		`${formatRuntimeAdapterExecutionGate(report, path)}\n\n## JSON\n\n\`\`\`json\n${JSON.stringify(report, null, 2)}\n\`\`\`\n`,
	);
	appendEvidence({
		kind: "artifact",
		title: "runtime-adapter-execution",
		fact: `RuntimeAdapterExecutionCheckV1 adapters=${report.adapters.length} runner=${report.closure.allHaveRunnerTemplates} parser=${report.closure.allHaveParserRules} ingest=${report.closure.allHaveIngestTargets}`,
		command: "re_runtime_adapter show",
		path,
		verify: `cat ${path}`,
		confidence:
			"runtime:adapter-execution adapter_runner_parser_ingest_contract evidence-ledger knowledge-graph re_note",
	});
	return path;
}
