/** Wire-reverse: configureProfessionalBridgeRuntime bag. */

import { PROFESSIONAL_RUNTIME_BRIDGE_MATRIX } from "../professional-runtime-bridges-data.ts";
import { configureProfessionalBridgeRuntime } from "../professional-runtime-bridges-runtime.ts";
import { RECON_APPEND_SYSTEM_PROMPT, RECON_SYSTEM_PROMPT } from "../resources/prompts-core.ts";
import { appendEvidence, parseToolIndex } from "../runtime-adapter-exec-deps.ts";
import { toolIndexPath } from "../storage/paths/core.ts";
import { buildToolDigest } from "../tool-index/catalog-core.ts";
import { repiIndexedToolPresent } from "../tool-presence.ts";
import type { PickFn } from "./wire-pick.ts";

export function wireProfessionalBridgeConfigure(pick: PickFn): void {
	configureProfessionalBridgeRuntime({
		indexedToolPresent: pick("indexedToolPresent", repiIndexedToolPresent),
		parseToolIndex: pick("parseToolIndex", parseToolIndex),
		toolIndexPath: pick("toolIndexPath", toolIndexPath),
		buildToolDigest: pick("buildToolDigest", buildToolDigest),
		appendEvidence: pick("appendEvidence", appendEvidence),
		RECON_SYSTEM_PROMPT: pick("RECON_SYSTEM_PROMPT", RECON_SYSTEM_PROMPT),
		RECON_APPEND_SYSTEM_PROMPT: pick("RECON_APPEND_SYSTEM_PROMPT", RECON_APPEND_SYSTEM_PROMPT),
		PROFESSIONAL_RUNTIME_BRIDGE_MATRIX: pick(
			"PROFESSIONAL_RUNTIME_BRIDGE_MATRIX",
			PROFESSIONAL_RUNTIME_BRIDGE_MATRIX,
		),
	});
}
