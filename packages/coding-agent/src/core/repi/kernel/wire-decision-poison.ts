/** Wire-decision: configurePoisonSanitize bag. */

import {
	buildMemoryStoreVerificationUnlocked,
	caseMemoryPath,
	invalidateDepositionChainCache,
	memoryDepositionEventBusPath,
	memoryDepositionEventHash,
	memoryEventHash,
	memoryEventsPath,
	memoryPath,
	readMemoryDepositionEvents,
	readMemoryEvents,
	rebuildCaseMemoryFromEvents,
	writeFileAtomic,
} from "../memory-stubs.ts";
import { normalizeHistoricalCommand } from "../playbooks-deps.ts";
import {
	configurePoisonSanitize,
	redactRepiPoisonText,
	sanitizeMemoryCaseSignature,
	sanitizeMemoryCommands,
	sanitizeMemoryList,
	sanitizeMemoryRoute,
	sanitizeMemoryText,
} from "../poison-sanitize.ts";
import { containsRepiPoison, sanitizeTargetForCommand } from "../target.ts";
import type { PickFn } from "./wire-pick.ts";

export function wirePoisonSanitizeConfigure(pick: PickFn): void {
	configurePoisonSanitize({
		buildMemoryStoreVerificationUnlocked: pick(
			"buildMemoryStoreVerificationUnlocked",
			buildMemoryStoreVerificationUnlocked,
		),
		caseMemoryPath: pick("caseMemoryPath", caseMemoryPath),
		containsRepiPoison: pick("containsRepiPoison", containsRepiPoison),
		invalidateDepositionChainCache: pick("invalidateDepositionChainCache", invalidateDepositionChainCache),
		memoryDepositionEventBusPath: pick("memoryDepositionEventBusPath", memoryDepositionEventBusPath),
		memoryDepositionEventHash: pick("memoryDepositionEventHash", memoryDepositionEventHash),
		memoryEventHash: pick("memoryEventHash", memoryEventHash),
		memoryEventsPath: pick("memoryEventsPath", memoryEventsPath),
		memoryPath: pick("memoryPath", memoryPath),
		normalizeHistoricalCommand: pick("normalizeHistoricalCommand", normalizeHistoricalCommand),
		readMemoryDepositionEvents: pick("readMemoryDepositionEvents", readMemoryDepositionEvents),
		readMemoryEvents: pick("readMemoryEvents", readMemoryEvents),
		rebuildCaseMemoryFromEvents: pick("rebuildCaseMemoryFromEvents", rebuildCaseMemoryFromEvents),
		redactRepiPoisonText: pick("redactRepiPoisonText", redactRepiPoisonText),
		sanitizeMemoryCaseSignature: pick("sanitizeMemoryCaseSignature", sanitizeMemoryCaseSignature),
		sanitizeMemoryCommands: pick("sanitizeMemoryCommands", sanitizeMemoryCommands),
		sanitizeMemoryList: pick("sanitizeMemoryList", sanitizeMemoryList),
		sanitizeMemoryRoute: pick("sanitizeMemoryRoute", sanitizeMemoryRoute),
		sanitizeMemoryText: pick("sanitizeMemoryText", sanitizeMemoryText),
		sanitizeTargetForCommand: pick("sanitizeTargetForCommand", sanitizeTargetForCommand),
		writeFileAtomic: pick("writeFileAtomic", writeFileAtomic),
	});
}
