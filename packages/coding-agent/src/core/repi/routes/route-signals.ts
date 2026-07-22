/** Route signal detectors for reverse/pentest domain routing. */
export type RouteSignals = {
	webTargetSignal: boolean;
	jsSpecific: boolean;
	nativeConcreteSignal: boolean;
	nativeReverseWord: boolean;
	nativeRouteSignal: boolean;
	memoryForensicsSignal: boolean;
	pcapDfirSignal: boolean;
	nonAgentConcreteTargetSignal: boolean;
	agentBoundarySpecific: boolean;
	exploitReliabilitySpecific: boolean;
};

export function detectRouteSignals(text: string): RouteSignals {
	const lower = text.toLowerCase();
	// Web-target signal: a URL / web-site / HTTP-API reference makes this a Web task,
	// NOT a Native reverse task — even when the word "逆向" appears.
	const webTargetSignal =
		/https?:\/\/|www\.|\.(?:com|net|org|io|cn|app|dev|site|co|xyz|info|biz)\b|网站|站点|网页|接口|endpoint|\bhttp\b|登录|cookie|session|bearer|authorization|请求|响应|header|x-forwarded|user-agent/i.test(
			lower,
		);
	// Do not treat bare "crypto" as frontend-JS — pure crypto/stego is a separate domain.
	const jsSpecific =
		/(?:\bjs\b|jsre|javascript|frontend|js\s*逆向|签名|加密参数|webpack|sourcemap|风控|webcrypto|subtle|\bsign\b|signature|timestamp|encrypt|decrypt)/.test(
			lower,
		) ||
		(/(?:xhr|fetch|websocket)/.test(lower) &&
			!/(?:api|graphql|jwt|oauth|auth|session|csrf|ssrf|idor|bola|xss|sqli|ssti|rce|web\s*api|web\s*渗透)/.test(
				lower,
			));
	const nativePathSignal =
		/(?:^|[\s`'"(])(?:\/(?:usr\/)?(?:local\/)?(?:bin|sbin|lib(?:32|64)?|opt|home)\/[\w./+-]+|\.\/[\w./+-]+\.(?:so|dll|exe|bin|elf|out))(?:\b|$)/i.test(
			text,
		) || /\/(?:usr\/)?(?:bin|sbin)\/[\w.+-]+/.test(lower);
	const nativeConcreteSignal =
		nativePathSignal ||
		/elf|pe\b|dll|so\b|binary|二进制|反编译|反汇编|\bida\b|radare2|\br2\b|ghidra|wasm|\.exe\b|executable|compiled|\bcrackme\b|keygen|license[-_ ]?check|许可证校验|\brizin\b|\brz-bin\b|checksec|ropgadget|one_gadget/i.test(
			lower,
		);
	// bare "reverse" must not flip generic reverse/pentest task → Native
	const nativeReverseWord = /逆向|reverse[-_ ]?engineer/i.test(lower);
	const nativeRouteSignal = nativeConcreteSignal || (nativeReverseWord && !webTargetSignal);
	const memoryForensicsSignal =
		/memory dump|memdump|mem\.raw|\.vmem|hiberfil|pagefile|volatility|内存取证|内存镜像|内存转储|lsass dump|crash dump/.test(
			lower,
		);
	const pcapDfirSignal = /\b(?:pcap|pcapng|tshark|wireshark|capinfos|dfir|forensic)\b|流量|取证/i.test(lower);
	const nonAgentConcreteTargetSignal =
		nativeRouteSignal ||
		webTargetSignal ||
		/\b(?:pcap|pcapng|tshark|wireshark|capinfos|dfir|forensic|firmware|rootfs|squashfs|apk|ipa|android|ios|frida|jadx|apktool|malware|yara|sigma|volatility|memdump|vmem|kerberos|ntlm|ldap|bloodhound|certipy|kubernetes|docker|metadata|aws|azure|gcp|crypto|stego)\b|流量|取证|固件|内存镜像|恶意样本|域控|云|容器|隐写/i.test(
			lower,
		);
	const agentBoundarySpecific =
		/prompt injection|system prompt|developer message|tool injection|tool-call|tool call|function call|mcp|model context protocol|agent\s*安全|llm\s*安全|rag|retrieval|memory poisoning|记忆投毒|工具滥用|越狱|jailbreak|indirect prompt|untrusted content|repi\s*(?:自身|self|harness|qa)|harness\s*qa|agent[-_ ]?thread|sub[-_ ]?agent|agent\s*(?:harness|runtime|orchestration|boundary)|env[-_ ]?only|model provider|print mode/.test(
			lower,
		);
	const exploitReliabilitySpecific =
		/autopwn|auto[-_ ]?pwn|exploit reliability|reliable exploit|stable exploit|poc replay|replay matrix|payload stability|crash flake|flake triage|one[-_ ]?click exploit|利用链.*稳定|稳定.*poc|复现矩阵|回放.*验证|一键.*利用/.test(
			lower,
		);
	return {
		webTargetSignal,
		jsSpecific,
		nativeConcreteSignal,
		nativeReverseWord,
		nativeRouteSignal,
		memoryForensicsSignal,
		pcapDfirSignal,
		nonAgentConcreteTargetSignal,
		agentBoundarySpecific,
		exploitReliabilitySpecific,
	};
}
