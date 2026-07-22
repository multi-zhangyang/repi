/** REPI tool bootstrap catalog: general web/utils. */
export const REPI_TOOL_BOOTSTRAP_CATALOG_GENERAL_WEB = [
	{
		tool: "curl",
		install: "sudo apt-get update && sudo apt-get install -y curl",
		verify: "command -v curl && curl --version | head -1",
	},
	{
		tool: "feroxbuster",
		install: "sudo apt-get update && sudo apt-get install -y feroxbuster",
		verify: "command -v feroxbuster && feroxbuster --version | head -1",
	},
	{
		tool: "nikto",
		install: "sudo apt-get update && sudo apt-get install -y nikto",
		verify: "command -v nikto && nikto -Version 2>&1 | head -1",
	},
	{
		tool: "dalfox",
		install:
			"command -v go >/dev/null 2>&1 || (sudo apt-get update && sudo apt-get install -y golang-go); go install github.com/hahwul/dalfox/v2@latest",
		verify: "command -v dalfox && dalfox version | head -1",
	},
	{
		tool: "arjun",
		install: "python3 -m pip install --user arjun",
		verify: "command -v arjun && arjun --version | head -1",
	},
] as const;
