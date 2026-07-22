/** REPI tool bootstrap catalog: general core tools. */
export const REPI_TOOL_BOOTSTRAP_CATALOG_GENERAL_CORE = [
	{
		tool: "hashcat",
		install: "sudo apt-get update && sudo apt-get install -y hashcat",
		verify: "command -v hashcat && hashcat --version",
	},
	{
		tool: "john",
		install: "sudo apt-get update && sudo apt-get install -y john",
		verify: "command -v john && john --list=build-info | head -1",
	},
	{
		tool: "hydra",
		install: "sudo apt-get update && sudo apt-get install -y hydra",
		verify: "command -v hydra && hydra -h | head -1",
	},
	{
		tool: "msfconsole",
		install:
			"sudo apt-get update && sudo apt-get install -y metasploit-framework || echo 'manual_tool_review metasploit-framework: if apt unavailable, use the official Metasploit installer (https://www.metasploit.com) or snap install metasploit-framework'",
		verify: "command -v msfconsole && msfconsole -v | head -1 || true",
	},
	{
		tool: "seccomp-tools",
		install: "gem install --user-install seccomp-tools",
		verify: "command -v seccomp-tools && seccomp-tools --version",
	},
	{
		tool: "docker",
		install: "sudo apt-get update && sudo apt-get install -y docker.io",
		verify: "command -v docker && docker --version",
	},
	{
		tool: "rg",
		install: "sudo apt-get update && sudo apt-get install -y ripgrep",
		verify: "command -v rg && rg --version | head -1",
	},
	{
		tool: "jq",
		install: "sudo apt-get update && sudo apt-get install -y jq",
		verify: "command -v jq && jq --version",
	},
	{
		tool: "unzip",
		install: "sudo apt-get update && sudo apt-get install -y unzip",
		verify: "command -v unzip && unzip -v | head -1",
	},
	{
		tool: "python3",
		install: "sudo apt-get update && sudo apt-get install -y python3 python3-pip",
		verify: "command -v python3 && python3 --version",
	},
	{
		tool: "node",
		install: "sudo apt-get update && sudo apt-get install -y nodejs npm",
		verify: "command -v node && node --version",
	},
	{
		tool: "npm",
		install: "sudo apt-get update && sudo apt-get install -y npm",
		verify: "command -v npm && npm --version",
	},
	{
		tool: "volatility3",
		install: "python3 -m pip install --user volatility3",
		verify: "command -v volatility3 && volatility3 -h | head -1",
	},
	{
		tool: "ios-deploy",
		install: "npm install -g ios-deploy",
		verify: "command -v ios-deploy && ios-deploy --version",
	},
	{
		tool: "7z",
		install: "sudo apt-get update && sudo apt-get install -y p7zip-full",
		verify: "command -v 7z && 7z | head -2",
	},
] as const;
