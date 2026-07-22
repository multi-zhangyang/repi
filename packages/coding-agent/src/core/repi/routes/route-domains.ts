/** Domain branch table for routeRepiTask. */
import type { RoutePlan } from "./patterns.ts";
import { plan } from "./patterns.ts";
import { routeRepiDomainEarly } from "./route-domains-early.ts";
import { routeRepiDomainMobileJs } from "./route-domains-mobile-js.ts";
import { routeRepiDomainNative } from "./route-domains-native.ts";
import { routeRepiDomainOps } from "./route-domains-ops.ts";
import { routeRepiDomainWeb } from "./route-domains-web.ts";
import type { RouteSignals } from "./route-signals.ts";

export function routeRepiDomainPlan(lower: string, s: RouteSignals): RoutePlan {
	return (
		routeRepiDomainEarly(lower, s) ??
		routeRepiDomainMobileJs(lower, s) ??
		routeRepiDomainWeb(lower, s) ??
		routeRepiDomainNative(lower, s) ??
		routeRepiDomainOps(lower, s) ??
		plan(
			"Reverse/Pentest general",
			"route unknown reverse/pentest task",
			"passive map + one minimal proof",
			"reverse-pentest-orchestrator",
			["classify artifact", "inspect evidence", "choose smallest proof", "verify", "record"],
		)
	);
}
