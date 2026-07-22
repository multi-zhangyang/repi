/**
 * REPI kernel profile runtime assembly.
 * Thin factory: configure bootstrap + wire + install registrars + goal mode.
 */
import { routeRepiTask } from "../routes.ts";

export { type RoutePlan, routeRepiTask } from "../routes.ts";
export const routeReconTask = routeRepiTask;
export type { ReconStats } from "./profile-runtime-factory.ts";
export { createReconExtensionFactory } from "./profile-runtime-factory.ts";
