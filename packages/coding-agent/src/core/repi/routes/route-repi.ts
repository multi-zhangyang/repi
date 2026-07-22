/** REPI domain router (native/web/mobile/pwn/...). */
import type { RoutePlan } from "./patterns.ts";
import { routeRepiDomainPlan } from "./route-domains.ts";
import { detectRouteSignals } from "./route-signals.ts";

export function routeRepiTask(text: string): RoutePlan {
	const lower = text.toLowerCase();
	const signals = detectRouteSignals(text);
	return routeRepiDomainPlan(lower, signals);
}

export type { RouteSignals } from "./route-signals.ts";
export { detectRouteSignals } from "./route-signals.ts";
