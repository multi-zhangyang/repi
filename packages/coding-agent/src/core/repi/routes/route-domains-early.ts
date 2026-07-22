/** Route domains: early exploit/agent/ctf/dfir seeds. */
import type { RoutePlan } from "./patterns.ts";
import { plan } from "./patterns.ts";
import type { RouteSignals } from "./route-signals.ts";

export function routeRepiDomainEarly(lower: string, s: RouteSignals): RoutePlan | undefined {
	if (s.exploitReliabilitySpecific) {
		return plan(
			"Exploit reliability",
			"turn a working PoC into repeatable, environment-pinned, evidence-backed exploitation",
			"PoC inventory + replay matrix + flake triage + artifact bundle",
			"exploit-reliability",
			["PoC inventory", "normalization", "replay matrix", "flake triage", "artifact bundle/report"],
		);
	}
	if (s.agentBoundarySpecific && !s.nonAgentConcreteTargetSignal) {
		return plan(
			"Agent / LLM boundary",
			"prove prompt, memory, tool-call, and delegation boundary failures",
			"prompt/resource map + tool schema/audit + injection replay harness",
			"agent-boundary",
			[
				"prompt/tool surface",
				"memory/retrieval boundary",
				"injection replay",
				"delegation/tool-call trace",
				"report",
			],
		);
	}
	if (s.memoryForensicsSignal) {
		return plan(
			"Memory forensics",
			"recover process, network, credential, malware, and timeline evidence from memory images",
			"volatility3/file/strings/yara + timeline/carving",
			"memory-forensics",
			["image profile", "process/network map", "credential/artifact hunt", "timeline/carve", "verification/report"],
		);
	}
	if (s.pcapDfirSignal) {
		return plan(
			"DFIR / PCAP / stego",
			"recover artifact or timeline",
			"tshark/volatility/exiftool + transform chain",
			"forensic",
			["artifact inventory", "timeline/flow map", "extract payload", "decode transform", "verify recovered data"],
		);
	}
	if (/ctf|靶场|challenge|flag|sandbox/.test(lower)) {
		return plan("CTF / sandbox", "prove minimal challenge path", "passive map + runtime proof", "ctf-sandbox", [
			"map entry surface",
			"identify dominant evidence",
			"prove one flow",
			"verify clean replay",
		]);
	}
	return undefined;
}
