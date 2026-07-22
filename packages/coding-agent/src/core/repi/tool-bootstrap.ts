/** Tool bootstrap: plan install/repair for missing tools on reverse lanes. */
export type { ToolBootstrapDeps } from "./tool-bootstrap-deps.ts";
export { configureToolBootstrap } from "./tool-bootstrap-deps.ts";
export {
	adaptiveSourceLaneName,
	bootstrapToolsFromLane,
	markToolBootstrapClosure,
	normalizeBootstrapToolToken,
} from "./tool-bootstrap-pure.ts";
export { runToolBootstrapClosure } from "./tool-bootstrap-run.ts";
