/** Memory lazy loaders for factory hooks (product-lean stubs). */
import { requireRepiModule } from "./loaders-require.ts";

export function shouldAutoDepositToolResult(...args: any[]): boolean {
	try {
		const mod = requireRepiModule("../memory-deposition.ts") as {
			shouldAutoDepositToolResult: (...a: any[]) => boolean;
		};
		return mod.shouldAutoDepositToolResult(...args);
	} catch {
		const mod = requireRepiModule("../memory-deposition.js") as {
			shouldAutoDepositToolResult: (...a: any[]) => boolean;
		};
		return mod.shouldAutoDepositToolResult(...args);
	}
}
export function buildPerTurnMemoryRecall(...args: any[]): any {
	try {
		const mod = requireRepiModule("../memory-stubs.ts") as { buildPerTurnMemoryRecall: (...a: any[]) => any };
		return mod.buildPerTurnMemoryRecall(...args);
	} catch {
		const mod = requireRepiModule("../memory-stubs.js") as { buildPerTurnMemoryRecall: (...a: any[]) => any };
		return mod.buildPerTurnMemoryRecall(...args);
	}
}
export function repiMemorySettings(...args: any[]): any {
	try {
		const mod = requireRepiModule("../memory-stubs.ts") as { repiMemorySettings: (...a: any[]) => any };
		return mod.repiMemorySettings(...args);
	} catch {
		const mod = requireRepiModule("../memory-stubs.js") as { repiMemorySettings: (...a: any[]) => any };
		return mod.repiMemorySettings(...args);
	}
}
export function appendMemoryDepositionRuntimeEvent(...args: any[]): any {
	try {
		const mod = requireRepiModule("../memory-transaction.ts") as {
			appendMemoryDepositionRuntimeEvent: (...a: any[]) => any;
		};
		return mod.appendMemoryDepositionRuntimeEvent(...args);
	} catch {
		const mod = requireRepiModule("../memory-transaction.js") as {
			appendMemoryDepositionRuntimeEvent: (...a: any[]) => any;
		};
		return mod.appendMemoryDepositionRuntimeEvent(...args);
	}
}

// Remaining hook deps resolved lazily via require / static imports used by agent/tool/compact hooks.
