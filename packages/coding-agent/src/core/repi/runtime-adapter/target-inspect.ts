/** Runtime adapter target inspection / auto-detect. */
export {
	hasMagic,
	hasRootfsMarkers,
	magicLabel,
	pushSignal,
	readFileHead,
	readFileTail,
	uniqueAdapterIds,
	uniqueTargetKinds,
} from "./target-inspect-helpers.ts";
export {
	detectRuntimeAdapterIds,
	inspectRuntimeAdapterTarget,
	reverseTargetInspectNextCommands,
} from "./target-inspect-inspect.ts";
