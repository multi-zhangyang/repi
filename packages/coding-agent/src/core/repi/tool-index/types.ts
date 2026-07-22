/** Tool-index types. */
export type BootstrapPlan = {
	tool: string;
	present: boolean;
	path?: string;
	install?: string;
	verify?: string;
	known: boolean;
};

export type BootstrapCatalogEntry = {
	tool: string;
	install?: string;
	verify?: string;
};

export type ToolIndexInstallDeps = {
	refreshToolIndex: (...args: any[]) => any;
	updateMissionCheckpoint: (...args: any[]) => any;
};
