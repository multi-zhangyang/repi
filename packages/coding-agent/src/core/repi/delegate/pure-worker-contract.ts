/** Delegate worker evidence/objective/tools (reverse-aware). */
import type { DelegateWorker } from "./types.ts";

export function delegateEvidenceContract(worker: DelegateWorker): string[] {
	const contracts: Record<DelegateWorker, string[]> = {
		"web-authz": [
			"request/response or WS frame",
			"auth/session/storage diff",
			"object ownership or state transition proof",
			"replay command",
		],
		identity: ["credential inventory", "usable credential proof", "principal/scope", "negative control"],
		cloud: ["runtime config", "identity/metadata response", "IAM/RBAC edge", "least-privilege command proof"],
		"mobile-runtime": [
			"package/app inventory",
			"Frida/ADB hook transcript",
			"crypto/signature/native bridge trace",
			"device/emulator replay command",
		],
		"native-runtime": [
			"binary hash/header/mitigation fingerprint",
			"loader/libc/symbol map",
			"GDB/LLDB/r2 trace",
			"breakpoint or local replay command",
		],
		"pwn-exploit": [
			"mitigation fingerprint",
			"crash/control primitive",
			"offset/leak/gadget",
			"local verifier or replay matrix",
		],
		"firmware-dfir": [
			"image/pcap/sample hash",
			"extracted artifact path",
			"flow/config/IOC timeline",
			"decode/transform chain",
		],
		agentsec: [
			"prompt/resource surface",
			"tool boundary proof",
			"memory/RAG poisoning path",
			"injection replay transcript",
		],
		malware: ["sample hash/magic/entropy", "YARA/capa/FLOSS or strings", "IOC/config extraction", "behavior trace"],
		reporting: ["attack/campaign/operation artifacts", "evidence ledger", "completion audit", "report scaffold"],
		general: ["command output", "artifact path", "verification command", "ledger update"],
	};
	const base = contracts[worker];
	const reverseWorkers = new Set([
		"native-runtime",
		"pwn-exploit",
		"mobile-runtime",
		"web-authz",
		"firmware-dfir",
		"malware",
	] as DelegateWorker[]);
	if (reverseWorkers.has(worker)) {
		return Array.from(
			new Set([
				...base,
				"runtime proof.exit=partial_runtime_capture|runtime_capture_strong",
				"technique bind_ready=true",
				"next: re_domain_proof_exit show",
				"next: re_complete audit",
				"next: re_runtime_adapter run",
			]),
		);
	}
	return base;
}

export function delegateObjective(worker: DelegateWorker): string {
	const objectives: Record<DelegateWorker, string> = {
		"web-authz": "证明 Web/API/WS 的认证、授权、对象所有权、状态机和 replay 边界",
		identity: "验证 credential/principal/ticket/hash/token/serviceaccount 的可用性、范围和负控",
		cloud: "证明云/K8s/container runtime config、metadata、IAM/RBAC 与最小 privilege edge",
		"mobile-runtime": "用 Frida/ADB/objection/静态清单证明移动端 runtime、hook 点、签名/加密与 native bridge",
		"native-runtime": "用 GDB/LLDB/r2/checksec 证明 native binary 的 loader/libc、符号、断点、trace 与控制流",
		"pwn-exploit": "把 binary/exploit phase 推进到 primitive、offset/leak、payload 和 replay reliability",
		"firmware-dfir": "组织 firmware/rootfs/PCAP/DFIR artifact、flow timeline、secret/config 和 transform chain",
		agentsec: "映射 prompt/tool/memory/RAG/MCP/sub-agent 边界并生成 injection replay 证据",
		malware: "提取 malware static/behavior/config/IOC 证据并沉淀可复用 rule/report",
		reporting: "合并证据、图谱、复现命令、失败路线和完成审计",
		general: "执行未归类 operation steps 并把证据回写到 ledger/checkpoints",
	};
	return objectives[worker];
}

export function delegateTools(worker: DelegateWorker): string[] {
	const tools: Record<DelegateWorker, string[]> = {
		"web-authz": ["curl", "jq", "playwright", "mitmproxy", "ffuf"],
		identity: ["ldapsearch", "nxc", "impacket-secretsdump", "certipy", "bloodhound-python"],
		cloud: ["docker", "kubectl", "aws", "az", "gcloud", "jq"],
		"mobile-runtime": ["adb", "frida", "objection", "apktool", "jadx", "r2"],
		"native-runtime": ["file", "checksec", "gdb", "lldb", "r2", "objdump", "readelf"],
		"pwn-exploit": ["file", "checksec", "gdb", "r2", "ROPgadget", "python3"],
		"firmware-dfir": ["binwalk", "unsquashfs", "tshark", "capinfos", "foremost", "python3"],
		agentsec: ["rg", "jq", "node", "python3"],
		malware: ["file", "sha256sum", "strings", "yara", "capa", "floss"],
		reporting: ["rg", "python3"],
		general: ["rg", "python3", "jq"],
	};
	return tools[worker];
}
