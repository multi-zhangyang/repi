/** Specialist pack native/mobile/pwn want detectors. */
export function detectSpecialistNativeWants(input: {
	domain: string;
	laneName: string;
	context: string;
	task: string;
	targetLooksApk: boolean;
	targetLooksIpa: boolean;
}): {
	wantsPwnPrimitive: boolean;
	wantsExploitReliability: boolean;
	wantsAndroidMobile: boolean;
	wantsIosMobile: boolean;
	wantsFridaTrace: boolean;
	wantsNativeDeep: boolean;
} {
	const { domain, laneName, context, task, targetLooksApk, targetLooksIpa } = input;
	const wantsPwnPrimitive =
		/\bpwn\b|\bexploit\b|\brop\b|ret2libc|\bheap\b|tcache|fastbin|format[-_ ]?string|fmtstr|srop|sigreturn|ret2dlresolve|one_gadget|seccomp|seccomp[-_ ]?bpf|syscall filter|pwntools|\bprimitive\b|cyclic|栈|堆/.test(
			context,
		) && /mitigation|primitive|exploit|runtime|proof|verify|poc|triage|map/.test(laneName);
	const wantsExploitReliability =
		(domain === "Exploit reliability" ||
			/autopwn|auto[-_ ]?pwn|exploit reliability|reliable exploit|stable exploit|poc replay|replay matrix|payload stability|crash flake|flake triage|one[-_ ]?click exploit|利用链.*稳定|稳定.*poc|复现矩阵|回放.*验证|一键.*利用/.test(
				context,
			)) &&
		/inventory|normalize|replay|flake|triage|bundle|report|exploit|poc|verify|stability|proof/.test(laneName);
	const wantsAndroidMobile =
		(domain === "Mobile / Android" ||
			targetLooksApk ||
			/(?:\bandroid\b|\bapk\b|smali|jadx|apktool|adb|dalvik|art\b|jni|so\b|frida|objection|移动端|安卓)/.test(
				context,
			)) &&
		/(?:\bapk\b|inventory|static|manifest|map|runtime|hook|network|replay|proof|verify|report|triage)/.test(laneName);
	const wantsIosMobile =
		(domain === "Mobile / iOS" ||
			targetLooksIpa ||
			/(?:\bios\b|\bipa\b|objective-c|objc|swift|mach-o|class-dump|otool|codesign|keychain|jailbreak|越狱|frida|objection)/.test(
				context,
			)) &&
		/(?:\bipa\b|inventory|static|class|map|runtime|hook|network|replay|proof|verify|report|triage)/.test(laneName);
	const wantsFridaTrace =
		/mobile|android|ios|apk|ipa|frida|jadx|apktool|adb|smali|native|binary|elf|mach-o|pe32|reverse|逆向|二进制/.test(
			context,
		) && /runtime|proof|control|flow|observe|verify|primitive|state|poc/.test(laneName);
	const nativeDeepAllowedDomain =
		/Native reverse|Pwn \/ exploit|Mobile \/ Android|Mobile \/ iOS|CTF \/ sandbox/.test(domain) ||
		/native|reverse|binary|elf|pe32|mach-o|wasm|pwn|rop|heap|crackme|license|serial|keygen|patch|symbolic|fuzz|二进制|逆向|反编译|反汇编/.test(
			task.toLowerCase(),
		);
	const wantsNativeDeep =
		nativeDeepAllowedDomain &&
		/native|reverse|binary|elf|pe32|mach-o|wasm|pwn|rop|heap|crackme|license|serial|keygen|patch|symbolic|fuzz|二进制|逆向|反编译|反汇编/.test(
			context,
		) &&
		/headers|triage|map|control|flow|primitive|runtime|proof|poc|verify|patch|fuzz|report/.test(laneName);

	return {
		wantsPwnPrimitive,
		wantsExploitReliability,
		wantsAndroidMobile,
		wantsIosMobile,
		wantsFridaTrace,
		wantsNativeDeep,
	};
}
