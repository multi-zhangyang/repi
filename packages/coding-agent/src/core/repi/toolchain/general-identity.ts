/** REPI tool bootstrap catalog: general identity/AD. */
export const REPI_TOOL_BOOTSTRAP_CATALOG_GENERAL_IDENTITY = [
	{
		tool: "impacket-secretsdump",
		install: "python3 -m pip install --user impacket",
		verify: "command -v impacket-secretsdump && impacket-secretsdump -h | head -1",
	},
	{
		tool: "nxc",
		install: "python3 -m pip install --user netexec",
		verify: "command -v nxc && nxc --version",
	},
	{
		tool: "crackmapexec",
		install: "python3 -m pip install --user crackmapexec",
		verify: "command -v crackmapexec && crackmapexec --version",
	},
	{
		tool: "bloodhound-python",
		install: "python3 -m pip install --user bloodhound",
		verify: "command -v bloodhound-python && bloodhound-python -h | head -1",
	},
	{
		tool: "certipy",
		install: "python3 -m pip install --user certipy-ad",
		verify: "command -v certipy && certipy -h | head -1",
	},
	{
		tool: "ldapsearch",
		install: "sudo apt-get update && sudo apt-get install -y ldap-utils",
		verify: "command -v ldapsearch && ldapsearch -VV 2>&1 | head -2",
	},
] as const;
