/** REPI extension factory + configure bootstrap. */
import type { ExtensionAPI } from "../../extensions/types.ts";
import { configureRepiProfileBootstrap } from "./profile-runtime-configure.ts";
import { installRepiExtensionSurface } from "./profile-runtime-install.ts";
import { createInitialReconStats } from "./profile-runtime-stats.ts";
import { wireRepiRuntimeModules } from "./wire-runtime.ts";

export type { ReconStats } from "./profile-runtime-stats.ts";

export function createReconExtensionFactory() {
	return function reconExtension(pi: ExtensionAPI): void {
		configureRepiProfileBootstrap();
		wireRepiRuntimeModules();

		const stats = createInitialReconStats();
		const compactAutoResumeIds = new Set<string>();
		const compactAutoResumeBudget = 3;
		void compactAutoResumeIds;
		void compactAutoResumeBudget;

		installRepiExtensionSurface(pi, stats);
	};
}
