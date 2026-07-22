/** Reverse I/O domain: browser facade. */
export {
	buildLiveBrowserArtifact,
	inferBrowserUrl,
	latestLiveBrowserArtifactPath,
} from "./browser-pure.ts";
export {
	buildLiveBrowserOutput,
	runLiveBrowser,
	writeLiveBrowserArtifact,
} from "./browser-run.ts";
