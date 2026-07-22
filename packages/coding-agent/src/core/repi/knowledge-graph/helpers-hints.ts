/** Knowledge-graph command/worker hints. */

import { reverseDomainCaptureNextCommands } from "../reverse-capture.ts";
import { reverseKnowledgeCaptureCommands } from "./reverse-commands.ts";

export function knowledgeCommandHints(text: string): string[] {
	const lines = text
		.split(/\r?\n/)
		.map((line: any) => line.trim().replace(/^- /, ""))
		.filter(Boolean)
		.filter((line: any) =>
			/^(re_|re-|\/re-|curl|python|node|gdb|r2|radare2|objdump|tshark|binwalk|kubectl|aws|az|gcloud|nmap|ffuf|rg|cat|test|timeout|jadx|frida|apktool)\b/i.test(
				line,
			),
		)
		.map((line: any) => line.replace(/^\//, ""))
		.slice(0, 60);
	return Array.from(
		new Set([
			...Array.from(new Set(lines)).slice(0, 18),
			...reverseKnowledgeCaptureCommands(text),
			...(/proof_exit|bind_ready|native|pwn|malware|firmware|mobile|browser|authz|reverse/i.test(text)
				? reverseDomainCaptureNextCommands({ routeOrBlob: text }).slice(0, 3)
				: []),
		]),
	).slice(0, 20);
}

export function knowledgeWorkerHints(tags: string[]): string[] {
	const workers = new Set<string>();
	const add = (tag: string, worker: string) => {
		if (tags.includes(tag)) workers.add(worker);
	};
	add("decision-core", "worker:commander -> decision core checkpoint pressure + operator_next_command arbitration");
	add("exploit-chain", "worker:commander -> exploit chain composer + proof path/replay queue");
	add("web-authz", "worker:web-authz -> browser/XHR/WS + authz state replay");
	add("js-signing", "worker:jsre -> signing normalizer + first-divergence harness");
	add("pwn", "worker:pwn-exploit -> primitive/leak/ROP verifier");
	add("pcap-dfir", "worker:firmware-dfir -> stream ranking + transform-chain extraction");
	add("firmware", "worker:firmware-dfir -> rootfs/service/emulation chain");
	add("cloud", "worker:cloud -> identity/RBAC/metadata edge proof");
	add("identity", "worker:identity -> principal/credential/graph edge proof");
	add("malware", "worker:malware -> config/IOC/behavior replay");
	add("agentsec", "worker:agentsec -> prompt/tool/memory boundary replay");
	add("repair", "worker:supervisor -> autofix/replay repair queue");
	add("reverse-proof-exit", "worker:commander -> reverse domain proof_exit / bind_ready gate");
	add("reverse-bind-ready", "worker:commander -> reverse runtime capture bind_ready promotion");
	add("reverse-capture-pending", "worker:commander -> reverseDomainCaptureNextCommands run-first");
	add("native-runtime", "worker:native-runtime -> re_native_runtime run + proof capture");
	add("mobile-runtime", "worker:mobile-runtime -> re_mobile_runtime run + frida/runtime proof");
	add("dispatcher-feedback", "worker:commander -> dispatcher feedback scoring + fallback route promotion");
	add(
		"compact-resume",
		"worker:commander -> compact resume contract, telemetry, proof-loop recovery, and case-memory promotion",
	);
	if (workers.size === 0) workers.add("worker:general -> map→prove→verify→replay loop");
	return Array.from(workers).slice(0, 12);
}
