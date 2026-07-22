/** Browser evidence signal types. */
export type BrowserEvidenceSignals = {
	findings: string[];
	runtimeLines: string[];
	websocketAnchors: string[];
	storageAnchors: string[];
	cdpLines: string[];
	artifactAnchors: string[];
	replayLines: string[];
	routeGraphLines: string[];
	authMatrixLines: string[];
	idorProbeLines: string[];
	authzStateLines: string[];
	authzSequenceLines: string[];
	authzOwnershipLines: string[];
	authzRollbackLines: string[];
	webAuthzStaticLines: string[];
	webSchemaLines: string[];
	webStateSourceLines: string[];
};
