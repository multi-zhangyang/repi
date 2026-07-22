/** REPI route classification and domain plans. */

import { formatRepiRoute, isRepiTask } from "./routes/patterns.ts";
import { routeRepiTask } from "./routes/route-repi.ts";

export type { RoutePlan } from "./routes/patterns.ts";
export {
	formatRepiRoute,
	isRepiTask,
	plan,
	REPI_TASK_PATTERNS,
} from "./routes/patterns.ts";
export { routeRepiTask } from "./routes/route-repi.ts";
export const routeReconTask = routeRepiTask;
export const isSecurityTask = isRepiTask;
export const formatRoute = formatRepiRoute;
