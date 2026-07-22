/** Lazy loaders for repi factory hook deps (core). */
// Landmark: loadMission loadRoutes loadToolTrace loadResources loadText loadTechniques loadToolIndex
import { requireRepiModule } from "./loaders-require.ts";

export function loadMission(): Record<string, any> {
	try {
		return requireRepiModule("../mission.ts") as Record<string, any>;
	} catch {
		return requireRepiModule("../mission.js") as Record<string, any>;
	}
}

export function loadRoutes(): Record<string, any> {
	try {
		return requireRepiModule("../routes.ts") as Record<string, any>;
	} catch {
		return requireRepiModule("../routes.js") as Record<string, any>;
	}
}

export function loadToolTrace(): Record<string, any> {
	try {
		return requireRepiModule("../tool-trace.ts") as Record<string, any>;
	} catch {
		return requireRepiModule("../tool-trace.js") as Record<string, any>;
	}
}

export function loadResources(): Record<string, any> {
	try {
		return requireRepiModule("../resources.ts") as Record<string, any>;
	} catch {
		return requireRepiModule("../resources.js") as Record<string, any>;
	}
}

export function loadText(): Record<string, any> {
	try {
		return requireRepiModule("../text.ts") as Record<string, any>;
	} catch {
		return requireRepiModule("../text.js") as Record<string, any>;
	}
}

export function loadTechniques(): Record<string, any> {
	try {
		return requireRepiModule("../techniques.ts") as Record<string, any>;
	} catch {
		return requireRepiModule("../techniques.js") as Record<string, any>;
	}
}

export function loadToolIndex(): Record<string, any> {
	try {
		return requireRepiModule("../tool-index.ts") as Record<string, any>;
	} catch {
		return requireRepiModule("../tool-index.js") as Record<string, any>;
	}
}
