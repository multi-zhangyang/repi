/** Proof-loop target runtime adapter commands. */

import { repiProofLoopRuntimeAdapterCommands as proofLoopRuntimeAdapterCommands } from "../../proof-loop.ts";
import { inspectRuntimeAdapterTarget } from "../../runtime-adapter.ts";

export function proofLoopTargetRuntimeAdapterCommands(target?: string): string[] {
	const targetRef = target?.trim();
	if (!targetRef) return ["re_domain_proof_exit show", "re_complete audit"];
	const profile = inspectRuntimeAdapterTarget(targetRef);
	const targetKinds = new Set(profile.targetKinds);
	const mobilePackageId =
		targetKinds.has("mobile-package") && /^([a-z][a-z0-9_]*\.){2,}[a-z][a-z0-9_]*$/i.test(targetRef);
	const strongRuntimeTarget =
		profile.exists || targetKinds.has("web-url") || targetKinds.has("cdp-endpoint") || mobilePackageId;
	if (!strongRuntimeTarget) return [];
	return proofLoopRuntimeAdapterCommands(profile.adapterIds, targetRef);
}
