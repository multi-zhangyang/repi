/** Mission lane packs: mobile_native. */
import type { MissionLane } from "../types.ts";

export function lanes_mobile_ios(): MissionLane[] {
	return [
		{
			name: "ipa-inventory",
			objective: "确认 IPA/Payload/App、Info.plist、Entitlements、Mach-O、Frameworks 和 URL schemes",
			next: ["unzip/list", "plist decode", "codesign/entitlements"],
		},
		{
			name: "static-class-map",
			objective: "定位 Objective-C/Swift 类、selector、Keychain、Crypto、NSURLSession 和 jailbreak/root 检测",
			next: ["otool/nm/strings", "class-dump fallback", "selector grep"],
		},
		{
			name: "runtime-hooks",
			objective: "生成 Frida/objection hook，捕获 keychain、CommonCrypto/CryptoKit、NSURLSession、签名函数和反调试",
			next: ["frida-ps/objection", "ObjC hooks", "native Interceptor"],
		},
		{
			name: "network-replay",
			objective: "复现移动端签名/请求链和证书绑定/代理/会话差异",
			next: ["request fields", "signature diff", "TLS pinning evidence"],
		},
		{
			name: "report",
			objective: "沉淀 IPA 结构、hook 点、请求重放、bypass 证据和复现命令",
			next: ["hook script", "replay verifier", "field journal"],
		},
	];
}

export function lanes_native_reverse_mobile_android(): MissionLane[] {
	return [
		{
			name: "triage",
			objective: "确认格式、架构、入口、保护、导入、manifest",
			next: ["strings", "imports", "protections"],
		},
		{
			name: "control-flow",
			objective: "定位关键函数、字符串引用、校验/解密分支",
			next: ["xrefs", "call graph", "伪代码/反汇编对照"],
		},
		{
			name: "runtime-proof",
			objective: "动态 trace/hook/patch 证明一个最小路径",
			next: ["断点/hook", "输入输出对照", "脚本化 decode"],
		},
		{
			name: "report",
			objective: "沉淀地址、偏移、脚本和复现命令",
			next: ["证据 ledger", "复现命令", "memory 回写"],
		},
	];
}
