/** REPI tool bootstrap catalog: cloud. */
export const REPI_TOOL_BOOTSTRAP_CATALOG_CLOUD = [
	{
		tool: "kubectl",
		install: "sudo apt-get update && sudo apt-get install -y kubernetes-client",
		verify: "command -v kubectl && (kubectl version --client --short 2>/dev/null || kubectl version --client)",
	},
	{
		tool: "az",
		install: "python3 -m pip install --user azure-cli",
		verify: "command -v az && az version | head -20",
	},
] as const;
