import { bootstrapCatalogFor } from "./catalog-core.ts";
import { toolsFromCommand } from "./catalog-tools.ts";
/** Tool recommendations by recon route/domain. */

/** reverse domains prioritize capture tooling; completion still needs runtime proof_exit partial|strong */
export function recommendedToolsForRoute(route: any, pack?: any, map?: any): string[] {
	const tools = new Set<string>(["file", "sha256sum", "rg", "python3"]);
	const domain = route.domain;
	const reverseHeavy = /native|pwn|malware|firmware|reverse|binary|exploit|mobile|frida|gdb|web|authz/i.test(
		String(domain ?? ""),
	);
	if (reverseHeavy) {
		for (const tool of ["checksec", "gdb", "r2", "frida", "ROPgadget", "file", "sha256sum", "strings"])
			tools.add(tool);
	}
	if (/Native reverse/i.test(domain)) {
		for (const tool of [
			"readelf",
			"strings",
			"objdump",
			"rabin2",
			"r2",
			"ghidra",
			"checksec",
			"gdb",
			"strace",
			"ltrace",
		])
			tools.add(tool);
	}
	if (/Pwn\s*\/\s*exploit/i.test(domain)) {
		for (const tool of ["checksec", "gdb", "ROPgadget", "ropper", "one_gadget", "patchelf"]) tools.add(tool);
	}
	if (domain === "Mobile / Android") {
		for (const tool of ["jadx", "apktool", "adb", "frida", "frida-ps", "objection", "aapt", "readelf", "r2"])
			tools.add(tool);
	}
	if (domain === "Mobile / iOS") {
		for (const tool of ["unzip", "plutil", "otool", "nm", "codesign", "class-dump", "frida", "frida-ps", "objection"])
			tools.add(tool);
	}
	if (domain === "Web / API pentest") {
		for (const tool of ["curl", "node", "nmap", "ffuf", "gobuster", "sqlmap", "burpsuite", "playwright"])
			tools.add(tool);
	}
	if (domain === "Web pentest scanning") {
		for (const tool of [
			"curl",
			"httpx",
			"katana",
			"ffuf",
			"feroxbuster",
			"gobuster",
			"nuclei",
			"nikto",
			"dalfox",
			"sqlmap",
			"burpsuite",
		])
			tools.add(tool);
	}
	if (domain === "Frontend JS reverse") {
		for (const tool of ["node", "npm", "curl", "playwright", "rg"]) tools.add(tool);
	}
	if (domain === "Firmware / IoT") {
		for (const tool of [
			"binwalk",
			"unblob",
			"unsquashfs",
			"ubireader_extract_files",
			"strings",
			"file",
			"r2",
			"qemu-mips",
			"qemu-arm",
			"qemu-aarch64",
		])
			tools.add(tool);
	}
	if (domain === "Agent / LLM boundary") {
		for (const tool of ["rg", "python3", "node", "jq", "curl", "playwright", "mitmproxy"]) tools.add(tool);
	}
	if (domain === "Exploit reliability") {
		for (const tool of ["python3", "jq", "curl", "file", "sha256sum", "node", "gdb"]) tools.add(tool);
	}
	if (/DFIR/i.test(domain)) {
		for (const tool of ["tshark", "capinfos", "tcpdump", "wireshark", "exiftool", "binwalk", "foremost"])
			tools.add(tool);
	}
	if (domain === "Memory forensics") {
		for (const tool of ["volatility3", "file", "strings", "yara", "python3", "foremost"]) tools.add(tool);
	}
	if (/Malware/i.test(domain)) {
		for (const tool of [
			"strings",
			"readelf",
			"rabin2",
			"objdump",
			"yara",
			"capa",
			"floss",
			"clamscan",
			"upx",
			"strace",
			"ltrace",
		]) {
			tools.add(tool);
		}
	}
	if (/Cloud|Container/i.test(domain)) {
		for (const tool of ["docker", "kubectl", "aws", "az", "gcloud", "nmap"]) tools.add(tool);
	}
	if (/Identity|Windows/.test(domain)) {
		for (const tool of ["impacket-secretsdump", "bloodhound-python", "certipy", "ldapsearch", "nxc", "crackmapexec"])
			tools.add(tool);
	}
	for (const command of pack?.commands ?? []) {
		for (const tool of toolsFromCommand(command.command)) tools.add(tool);
	}
	for (const signal of map?.signals ?? []) {
		if (/Android|Dalvik|APK/i.test(signal)) for (const tool of ["jadx", "apktool", "adb", "frida"]) tools.add(tool);
		if (/ELF|Mach-O|PE32|WebAssembly/i.test(signal))
			for (const tool of ["readelf", "strings", "r2", "objdump"]) tools.add(tool);
		if (/graphql|websocket|route|auth|jwt/i.test(signal))
			for (const tool of ["curl", "node", "ffuf", "playwright"]) tools.add(tool);
	}
	return Array.from(tools)
		.filter((tool: any) => bootstrapCatalogFor(tool) !== undefined)
		.slice(0, 24);
}
