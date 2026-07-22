/** REPI tool bootstrap catalog: crypto. */
export const REPI_TOOL_BOOTSTRAP_CATALOG_CRYPTO = [
	{
		tool: "openssl",
		install: "sudo apt-get update && sudo apt-get install -y openssl",
		verify: "command -v openssl && openssl version",
	},
	{
		tool: "z3",
		install: "python3 -m pip install --user z3-solver",
		verify: "python3 - <<'PYZ3'\nimport z3; print(z3.get_version_string())\nPYZ3",
	},
	{
		tool: "sage",
		install: "sudo apt-get update && sudo apt-get install -y sagemath",
		verify: "command -v sage && sage --version | head -1",
	},
] as const;
