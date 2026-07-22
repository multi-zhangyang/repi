/** REPI tool bootstrap catalog: web. */
export const REPI_TOOL_BOOTSTRAP_CATALOG_WEB = [
	{
		tool: "nmap",
		install: "sudo apt-get update && sudo apt-get install -y nmap",
		verify: "command -v nmap && nmap --version | head -1",
	},
	{
		tool: "masscan",
		install: "sudo apt-get update && sudo apt-get install -y masscan",
		verify: "command -v masscan && masscan --version | head -1",
	},
	{
		tool: "ffuf",
		install: "sudo apt-get update && sudo apt-get install -y ffuf",
		verify: "command -v ffuf && ffuf -V | head -1",
	},
	{
		tool: "gobuster",
		install: "sudo apt-get update && sudo apt-get install -y gobuster",
		verify: "command -v gobuster && gobuster version",
	},
	{
		tool: "sqlmap",
		install: "sudo apt-get update && sudo apt-get install -y sqlmap",
		verify: "command -v sqlmap && sqlmap --version",
	},
	{
		tool: "wfuzz",
		install: "sudo apt-get update && sudo apt-get install -y wfuzz",
		verify: "command -v wfuzz && wfuzz --version | head -1",
	},
	{
		tool: "httpx",
		install:
			"command -v go >/dev/null 2>&1 || (sudo apt-get update && sudo apt-get install -y golang-go); go install github.com/projectdiscovery/httpx/cmd/httpx@latest",
		verify: "command -v httpx && httpx -version | head -1",
	},
	{
		tool: "nuclei",
		install:
			"command -v go >/dev/null 2>&1 || (sudo apt-get update && sudo apt-get install -y golang-go); go install github.com/projectdiscovery/nuclei/v3/cmd/nuclei@latest",
		verify: "command -v nuclei && nuclei -version | head -1",
	},
	{
		tool: "katana",
		install:
			"command -v go >/dev/null 2>&1 || (sudo apt-get update && sudo apt-get install -y golang-go); go install github.com/projectdiscovery/katana/cmd/katana@latest",
		verify: "command -v katana && katana -version | head -1",
	},
	{
		tool: "burpsuite",
		install:
			"(sudo apt-get update && sudo apt-get install -y default-jdk curl) || true; echo 'manual_tool_review burpsuite: ensure JDK 17+, then download burpsuite_community_<ver>.jar from https://portswigger.net/burp/communitydownload and run java -jar burpsuite_community.jar; optionally alias burpsuite=java -jar /opt/burpsuite_community.jar'",
		verify: "command -v burpsuite || test -f /opt/burpsuite_community*.jar || true",
	},
	{
		tool: "mitmproxy",
		install: "python3 -m pip install --user mitmproxy",
		verify: "command -v mitmproxy && mitmproxy --version | head -1",
	},
	{
		tool: "playwright",
		install: "npm install -g playwright && playwright install",
		verify: "command -v playwright && playwright --version",
	},
] as const;
