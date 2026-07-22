/** Reverse runtime capture self-heal commands. */
import type { SelfHealCtx } from "./ctx.ts";

export function appendReverseHeals(ctx: SelfHealCtx): void {
	const { route, combined, findings, deficits, target, add, pack } = ctx;
	const reverseSignal =
		/native|pwn|reverse|binary|elf|mobile|firmware|malware|exploit|crypto|proof_exit|bind_ready|checksec|gdb|rop|frida|web_authz|browser|frontend|js.sign|sourcemap/i.test(
			[route, combined, findings.join("\n"), deficits.join("\n")].join("\n"),
		);
	if (
		reverseSignal ||
		/pending_runtime_capture|bind_ready\s*=\s*false|proof_exit\s*=\s*pending|reverse_proof|require_proof_exit_before_claim/i.test(
			combined,
		)
	) {
		add(
			"heal-reverse-domain-proof-exit",
			"re_domain_proof_exit show",
			"recover domain proof-exit closure and required runtime capture gate",
		);
		add(
			"heal-reverse-complete-audit",
			"re_complete audit",
			"completion requires partial/strong runtime capture before claim",
		);
		add(
			"heal-reverse-runtime-adapter",
			target ? `re_runtime_adapter run ${target}` : "re_runtime_adapter run <TARGET>",
			"run reverse runtime adapter for proof.exit capture signals",
		);
		// Domain-aware live capture (prefer run over plan when target known).
		if (/frontend|js/i.test(route) || /js-signing|sourcemap|crypto\.subtle/i.test(combined)) {
			add(
				"heal-reverse-js-signing",
				target ? `re_js_signing run ${target}` : "re_js_signing run <url-or-bundle>",
				"JS signing/hook/rebuild runtime capture for proof.exit",
			);
			add(
				"heal-reverse-live-browser",
				target && /^https?:\/\//i.test(target) ? `re_live_browser run ${target}` : "re_live_browser run <URL>",
				"browser/XHR runtime capture for web/js reverse",
			);
		} else if (/web|api|browser|authz/i.test(route)) {
			add(
				"heal-reverse-live-browser",
				target && /^https?:\/\//i.test(String(target ?? pack.target ?? ""))
					? `re_live_browser run ${target ?? pack.target}`
					: "re_live_browser run <URL>",
				"browser/XHR runtime capture",
			);
			add(
				"heal-reverse-web-authz",
				target && /^https?:\/\//i.test(String(target ?? pack.target ?? ""))
					? `re_web_authz_state run ${target ?? pack.target}`
					: "re_web_authz_state run <URL>",
				"authz principal/object matrix capture",
			);
		} else if (/mobile/i.test(route)) {
			add(
				"heal-reverse-mobile-runtime",
				target ? `re_mobile_runtime run ${target}` : "re_mobile_runtime run <apk-or-package>",
				"mobile APK/Frida runtime capture",
			);
		} else if (target || /native|pwn|binary|elf|firmware|malware|exploit/i.test(route)) {
			add(
				"heal-reverse-native-runtime",
				target ? `re_native_runtime run ${target}` : "re_native_runtime run <elf>",
				"native checksec/r2/ROP runtime capture",
			);
			if (/pwn|exploit/i.test(route)) {
				add(
					"heal-reverse-exploit-lab",
					target ? `re_exploit_lab run ${target}` : "re_exploit_lab run <PoC>",
					"exploit lab multi-run reliability capture",
				);
			}
		}
	}
}
