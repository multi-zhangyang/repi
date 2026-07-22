/** Route domains: mobile + frontend JS. */
import type { RoutePlan } from "./patterns.ts";
import { plan } from "./patterns.ts";
import type { RouteSignals } from "./route-signals.ts";

export function routeRepiDomainMobileJs(lower: string, s: RouteSignals): RoutePlan | undefined {
	if (/ios|ipa|objective-c|objc|swift|mach-o|mach_o|class-dump|otool|codesign|keychain|jailbreak|越狱/.test(lower)) {
		return plan(
			"Mobile / iOS",
			"reverse IPA/iOS logic, entitlement/keychain/network signing, or runtime checks",
			"ipa/unzip/plist/otool/nm/class-dump + Frida/objection",
			"mobile-ios-reverse",
			[
				"IPA inventory",
				"Info.plist/entitlements",
				"Mach-O/class map",
				"Frida/objection hooks",
				"network/keychain replay",
			],
		);
	}
	if (/apk|android|jadx|apktool|smali|frida|objection/.test(lower)) {
		return plan(
			"Mobile / Android",
			"reverse app logic or bypass runtime checks",
			"jadx/apktool/adb/frida",
			"mobile-reverse",
			["manifest map", "Java/Kotlin call chain", "native split", "Frida hook", "evidence replay"],
		);
	}
	if (s.jsSpecific) {
		return plan(
			"Frontend JS reverse",
			"recover signing/encryption chain",
			"browser/CDP/hook + Node rebuild",
			"js-reverse",
			["observe requests", "capture initiator", "hook args/returns", "local rebuild", "first-divergence patch"],
		);
	}
	return undefined;
}
