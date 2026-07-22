/** REPI route patterns, plan helper, and format. */
export type RoutePlan = {
	domain: string;
	intent: string;
	toolchain: string;
	skillHint: string;
	workflow: string[];
};

export const REPI_TASK_PATTERNS = [
	/apk|android|ios|ipa|frida|objection|jadx|apktool|smali/i,
	/ida|radare2|\br2\b|ghidra|binary|二进制|逆向|反编译|反汇编|elf|pe\b|dll|so\b|wasm|vmprotect|upx|checksec|nx\b|pie\b|relro|aslr|shellcode/i,
	/\bctf\b|\bpwn\b|\brop\b|ret2libc|\bheap\b|tcache|fastbin|format[-_ ]?string|fmtstr|srop|sigreturn|ret2dlresolve|dlresolve|one_gadget|seccomp|seccomp[-_ ]?bpf|syscall filter|pwntools|漏洞利用|\bexploit\b/i,
	/js\s*逆向|签名|加密参数|风控|webpack|sourcemap|hook|xhr|fetch|websocket/i,
	/web\s*渗透|api\s*安全|graphql|jwt|oauth|ssrf|idor|bola|xss|sqli|ssti|csrf|rce|waf|burp|漏洞扫描|目录扫描|nuclei|ffuf|gobuster|sqlmap|dalfox/i,
	/firmware|固件|iot|binwalk|squashfs|uboot|uart|jtag|mips|arm/i,
	/pcap|流量|取证|dfir|forensic|stego|隐写|wireshark|tshark|memory dump|memdump|vmem|volatility|内存取证|内存镜像/i,
	/cloud|aws|azure|gcp|metadata|k8s|kubernetes|docker|container|容器|云/i,
	/\bad\b|active directory|kerberos|ntlm|ldap|windows|lsass|mimikatz|bloodhound|certipy|域控|内网|横向|提权|凭据/i,
	/malware|恶意|样本|yara|sigma|ioc|c2|沙箱|反调试|反沙箱/i,
	/prompt injection|agent\s*安全|llm\s*安全|越狱|记忆投毒|工具滥用/i,
	// Product harness: English reverse/pentest phrasing that previously missed cold-start.
	/\breverse\b|\bpentest\b|\brecon\b|\brepi\b|native\s*runtime|proof\.exit|bind_ready|domain_proof/i,
] as const;

export function isRepiTask(text: string): boolean {
	return REPI_TASK_PATTERNS.some((pattern: any) => pattern.test(text));
}

export function plan(
	domain: string,
	intent: string,
	toolchain: string,
	skillHint: string,
	workflow: string[],
): RoutePlan {
	return { domain, intent, toolchain, skillHint, workflow };
}

export function formatRepiRoute(plan: RoutePlan): string {
	return `路由: ${plan.domain} / ${plan.intent} / ${plan.toolchain}`;
}
