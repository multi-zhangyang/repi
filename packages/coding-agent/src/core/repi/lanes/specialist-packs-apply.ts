/** Specialist pack apply handlers + reverse domain bridge. */

import { reverseDomainCaptureNextCommands } from "../reverse-capture.ts";
import {
	applyWantsAgentSecurity,
	applyWantsCloudRuntime,
	applyWantsIdentityAd,
} from "./specialist-packs/cloud_identity_agent.ts";
import { applyWantsCryptoStego, applyWantsMalware } from "./specialist-packs/crypto_malware.ts";
import { applyWantsFirmware, applyWantsMemoryForensics, applyWantsPcap } from "./specialist-packs/firmware_dfir.ts";
import { applyWantsAndroidMobile, applyWantsIosMobile } from "./specialist-packs/mobile.ts";
import {
	applyWantsExploitReliability,
	applyWantsFridaTrace,
	applyWantsNativeDeep,
	applyWantsPwnPrimitive,
} from "./specialist-packs/native_pwn.ts";
import type { SpecialistPackContext } from "./specialist-packs/types.ts";
import { applyWantsBrowser, applyWantsJsSigning, applyWantsWebScanner } from "./specialist-packs/web.ts";

export function applySpecialistPackHandlers(ctx: SpecialistPackContext): void {
	const {
		wantsWebScanner,
		wantsMemoryForensics,
		wantsAndroidMobile,
		wantsIosMobile,
		wantsNativeDeep,
		wantsBrowser,
		wantsJsSigning,
		wantsPwnPrimitive,
		wantsExploitReliability,
		wantsPcap,
		wantsFirmware,
		wantsCryptoStego,
		wantsAgentSecurity,
		wantsMalware,
		wantsCloudRuntime,
		wantsIdentityAd,
		wantsFridaTrace,
	} = ctx;
	if (wantsWebScanner) applyWantsWebScanner(ctx);
	if (wantsMemoryForensics) applyWantsMemoryForensics(ctx);
	if (wantsAndroidMobile) applyWantsAndroidMobile(ctx);
	if (wantsIosMobile) applyWantsIosMobile(ctx);
	if (wantsNativeDeep) applyWantsNativeDeep(ctx);
	if (wantsBrowser) applyWantsBrowser(ctx);
	if (wantsJsSigning) applyWantsJsSigning(ctx);
	if (wantsPwnPrimitive) applyWantsPwnPrimitive(ctx);
	if (wantsExploitReliability) applyWantsExploitReliability(ctx);
	if (wantsPcap) applyWantsPcap(ctx);
	if (wantsFirmware) applyWantsFirmware(ctx);
	if (wantsCryptoStego) applyWantsCryptoStego(ctx);
	if (wantsAgentSecurity) applyWantsAgentSecurity(ctx);
	if (wantsMalware) applyWantsMalware(ctx);
	if (wantsCloudRuntime) applyWantsCloudRuntime(ctx);
	if (wantsIdentityAd) applyWantsIdentityAd(ctx);
	if (wantsFridaTrace) applyWantsFridaTrace(ctx);
}

export function appendSpecialistReverseBridge(ctx: SpecialistPackContext, notes: string[]): void {
	const { specialists, add } = ctx;
	if (specialists.length === 0) return;
	const domainHint = ctx.wantsPwnPrimitive
		? "pwn"
		: ctx.wantsNativeDeep
			? "rev-native"
			: ctx.wantsAndroidMobile || ctx.wantsIosMobile
				? ctx.wantsIosMobile
					? "mobile-ios"
					: "mobile"
				: ctx.wantsPcap
					? "pcap-dfir"
					: ctx.wantsFirmware
						? "firmware-iot"
						: ctx.wantsMemoryForensics
							? "memory-forensics"
							: ctx.wantsCryptoStego
								? "crypto"
								: ctx.wantsMalware
									? "malware-analysis"
									: ctx.wantsAgentSecurity
										? "agent-security"
										: ctx.wantsWebScanner
											? "web-scan"
											: ctx.wantsBrowser
												? "web-api"
												: ctx.wantsJsSigning
													? "frontend-js"
													: "";
	if (domainHint) {
		add(
			"domain-proof-exit-bridge",
			`printf '%s\n' "re_domain_proof_exit show ${domainHint}" "re_domain_proof_exit write ${domainHint}" "re_toolchain_domain show ${domainHint}"`,
			"domain proof-exit closure bridge: match runtime artifacts against required proof-exit signals",
		);
	}
	const reverseNext = reverseDomainCaptureNextCommands({
		routeOrBlob: `${ctx.domain} ${ctx.laneName} ${domainHint} ${specialists.join(" ")}`,
		target: ctx.target,
	}).slice(0, 4);
	for (const [index, cmd] of reverseNext.entries()) {
		add(`reverse-domain-next-${index + 1}`, cmd, "reverse domain capture next (run-first)");
	}
	notes.push(`specialist_runtime_planner: ${Array.from(new Set(specialists)).join(", ")}`);
}
