/** Passive map run helpers. */
import type { ExtensionAPI } from "../extensions/types.ts";
import {
	defaultAppendEvidence,
	type PassiveMapSideEffects,
	passiveMapReverseNextCommands,
	passiveMapScript,
	passiveMapSignals,
	writePassiveMapArtifact,
} from "./passive-map-pure.ts";
import { truncateMiddle } from "./text.ts";

export type { PassiveMapContext } from "./passive-map-context.ts";
export {
	inferTargetFromMap,
	latestPassiveMapContext,
	mapTargetUsable,
} from "./passive-map-context.ts";

export async function runPassiveMap(
	pi: ExtensionAPI,
	params: { target?: string; depth?: number } = {},
	sideEffects: PassiveMapSideEffects = {},
): Promise<string> {
	const depth = Math.min(Math.max(Math.floor(params.depth ?? 4), 1), 8);
	const script = passiveMapScript(params.target, depth);
	const result = await pi.exec("bash", ["-lc", script], { timeout: 60000 });
	const signals = passiveMapSignals(result.stdout, result.stderr);
	const artifactPath = writePassiveMapArtifact({ target: params.target, depth, script, result, signals });
	const appendEvidence = sideEffects.appendEvidence ?? defaultAppendEvidence;
	const evidence = appendEvidence({
		kind: "artifact",
		title: `passive-map ${params.target ?? "workspace"} exit ${result.code}`,
		fact: [
			`Captured passive target/workspace map with ${signals.length} parsed signal(s)`,
			`stdout=${result.stdout.length}B`,
			`stderr=${result.stderr.length}B`,
			result.killed ? "killed=true" : "killed=false",
			signals.length ? `signals=${signals.slice(0, 10).join(" | ")}` : undefined,
		]
			.filter(Boolean)
			.join("; "),
		command: `re_map${params.target ? ` ${params.target}` : ""}`,
		path: artifactPath,
		verify: `cat ${artifactPath}`,
		confidence: "auto-captured passive map",
	});
	sideEffects.onMapped?.(artifactPath);
	const reverseNext = passiveMapReverseNextCommands(signals, params.target);
	return [
		"passive_map_result:",
		`exit: ${result.code}`,
		`map_artifact: ${artifactPath}`,
		`evidence_ledger: ${evidence.timestamp} ${evidence.title}`,
		`signals: ${signals.length}`,
		"",
		"top_signals:",
		...(signals.length > 0 ? signals.slice(0, 20).map((signal: any) => `- ${signal}`) : ["- none"]),
		...(reverseNext.length ? ["", "reverse_domain_next:", ...reverseNext.map((cmd: any) => `- next: ${cmd}`)] : []),
		result.stdout.trim() ? ["", "stdout:", "```", truncateMiddle(result.stdout.trim(), 6000), "```"].join("\n") : "",
		result.stderr.trim() ? ["", "stderr:", "```", truncateMiddle(result.stderr.trim(), 2000), "```"].join("\n") : "",
	]
		.filter(Boolean)
		.join("\n");
}
