/** Self-heal shared helpers. */

import { uniqueMatches } from "../../text.ts";
import type { LaneCommand } from "../specialist-packs.ts";
import type { LaneCommandPack, SelfHealToolResolvers } from "./types.ts";

let resolvers: SelfHealToolResolvers = {
	commandKnownTools: () => [],
};

export function pythonString(value: string): string {
	return JSON.stringify(value);
}

export function configureSelfHealToolResolvers(next: SelfHealToolResolvers): void {
	resolvers = next;
}

export function commandKnownTools(command: string): string[] {
	return resolvers.commandKnownTools(command);
}

export function packHasSpecialistSignal(pack: LaneCommandPack, pattern: RegExp): boolean {
	return (
		pack.commands.some((command: any) => pattern.test(`${command.label}\n${command.evidence}\n${command.command}`)) ||
		pack.notes.some((note: any) => pattern.test(note))
	);
}

export function dedupeLaneCommands(commands: LaneCommand[]): LaneCommand[] {
	const seen = new Set<string>();
	const out: LaneCommand[] = [];
	for (const command of commands) {
		const key = `${command.label}\n${command.command}`;
		if (seen.has(key)) continue;
		seen.add(key);
		out.push(command);
	}
	return out;
}

export function transcriptRepairItems(combined: string): string[] {
	const values = [
		...uniqueMatches(combined, /\b(?:bash|sh|zsh):(?: line \d+:)?\s*([A-Za-z0-9_.+-]+): command not found/gi, 12),
		...uniqueMatches(combined, /\b([A-Za-z0-9_.+-]+): command not found/gi, 12),
		...uniqueMatches(combined, /\b(?:bash|sh|zsh):\s*(?:\d+:\s*)?([A-Za-z0-9_.+-]+): not found\b/gi, 12),
		...uniqueMatches(combined, /ModuleNotFoundError:\s+No module named ['"]?([A-Za-z0-9_.-]+)/gi, 12),
		...uniqueMatches(combined, /ImportError:\s+No module named ['"]?([A-Za-z0-9_.-]+)/gi, 12),
		...uniqueMatches(combined, /Cannot find module ['"]([^'"]+)['"]/gi, 12),
	];
	return [...new Set(values.map((value: any) => value.replace(/^node:/, "").trim()))]
		.filter((value: any) => /^[A-Za-z0-9_.+/@-]{2,80}$/.test(value) && !/^(line|not|found|module)$/i.test(value))
		.slice(0, 12);
}

export function toolRepairMatrixScript(params: {
	pack: LaneCommandPack;
	combined: string;
	repairItems: string[];
	errorLines: string[];
}): string {
	const commandTools = commandKnownTools(params.pack.commands.map((command: any) => command.command).join("\n"));
	const payload = {
		route: params.pack.route,
		lane: params.pack.lane,
		target: params.pack.target ?? "",
		repairItems: params.repairItems,
		commandTools,
		errorLines: params.errorLines.slice(0, 12),
	};
	return `cat > /tmp/repi-tool-repair.py <<'PY'\nimport json, pathlib, shutil\npayload=json.loads(${pythonString(JSON.stringify(payload))})\nalternatives={\n 'checksec':['rabin2','readelf','objdump','file'],\n 'r2':['rabin2','objdump','readelf','strings','ghidra'],\n 'radare2':['rabin2','objdump','readelf','strings','ghidra'],\n 'rabin2':['readelf','objdump','file'],\n 'gdb':['lldb','strace','ltrace','objdump'],\n 'ltrace':['strace','gdb'],\n 'strace':['ltrace','gdb','ldd'],\n 'binwalk':['unblob','unsquashfs','file','7z'],\n 'unblob':['binwalk','unsquashfs','file','7z'],\n 'unsquashfs':['binwalk','unblob','7z','file'],\n 'tshark':['tcpdump','capinfos','wireshark'],\n 'capinfos':['tshark','file'],\n 'tcpdump':['tshark','capinfos'],\n 'jadx':['apktool','unzip','strings'],\n 'apktool':['jadx','unzip','strings'],\n 'frida':['frida-ps','gdb','adb'],\n 'curl':['python3','node','wget'],\n 'jq':['python3','node'],\n 'node':['python3'],\n 'python3':['python','node'],\n 'ROPgadget':['ropper','objdump','rabin2'],\n 'ropper':['ROPgadget','objdump','rabin2'],\n 'nmap':['naabu','masscan','curl'],\n 'ffuf':['gobuster','wfuzz','curl'],\n 'gobuster':['ffuf','wfuzz','curl'],\n 'kubectl':['grep','rg'],\n 'aws':['env','grep'],\n 'az':['env','grep'],\n 'gcloud':['env','grep'],\n}\nitems=list(dict.fromkeys(payload.get('repairItems') or payload.get('commandTools') or []))\nprint('[tool-repair]', 'route='+payload.get('route',''), 'lane='+payload.get('lane',''), 'target='+(payload.get('target') or '<none>'), 'items='+(','.join(items) if items else 'none'))\nfor line in payload.get('errorLines', [])[:8]:\n    print('[tool-repair-error]', line[:240])\nfor item in items:\n    alts=alternatives.get(item, [])\n    present=[tool for tool in alts if shutil.which(tool)]\n    direct=shutil.which(item)\n    print('[tool-repair-candidate]', 'item='+item, 'present='+str(bool(direct)).lower(), 'direct='+(direct or ''), 'alternatives='+(','.join(present or alts) if alts else ''), 'bootstrap_hint=re_bootstrap plan '+item)\npathlib.Path('/tmp/repi-tool-repair.json').write_text(json.dumps({'payload':payload,'items':items}, indent=2))\nprint('[tool-repair-artifact]', '/tmp/repi-tool-repair.json')\nPY\npython3 /tmp/repi-tool-repair.py`;
}
