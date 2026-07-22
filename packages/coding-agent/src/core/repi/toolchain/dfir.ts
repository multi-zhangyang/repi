/** REPI tool bootstrap catalog: dfir. */
export const REPI_TOOL_BOOTSTRAP_CATALOG_DFIR = [
	{
		tool: "tshark",
		install:
			"sudo DEBIAN_FRONTEND=noninteractive apt-get update && sudo DEBIAN_FRONTEND=noninteractive apt-get install -y tshark",
		verify: "command -v tshark && tshark --version | head -1",
	},
	{
		tool: "capinfos",
		install:
			"sudo DEBIAN_FRONTEND=noninteractive apt-get update && sudo DEBIAN_FRONTEND=noninteractive apt-get install -y tshark",
		verify: "command -v capinfos && capinfos -h | head -1",
	},
	{
		tool: "tcpdump",
		install: "sudo apt-get update && sudo apt-get install -y tcpdump",
		verify: "command -v tcpdump && tcpdump --version | head -1",
	},
	{
		tool: "wireshark",
		install: "sudo apt-get update && sudo DEBIAN_FRONTEND=noninteractive apt-get install -y wireshark",
		verify: "command -v wireshark && wireshark --version | head -1 || true",
	},
	{
		tool: "exiftool",
		install: "sudo apt-get update && sudo apt-get install -y libimage-exiftool-perl",
		verify: "command -v exiftool && exiftool -ver",
	},
	{
		tool: "foremost",
		install: "sudo apt-get update && sudo apt-get install -y foremost",
		verify: "command -v foremost && foremost -V 2>&1 | head -1",
	},
	{
		tool: "yara",
		install: "sudo apt-get update && sudo apt-get install -y yara",
		verify: "command -v yara && yara --version",
	},
	{
		tool: "capa",
		install: "python3 -m pip install --user flare-capa",
		verify: "command -v capa && capa --version | head -1",
	},
	{
		tool: "floss",
		install: "python3 -m pip install --user flare-floss",
		verify: "command -v floss && floss --version | head -1",
	},
	{
		tool: "clamscan",
		install: "sudo apt-get update && sudo apt-get install -y clamav",
		verify: "command -v clamscan && clamscan --version | head -1",
	},
	{
		tool: "upx",
		install: "sudo apt-get update && sudo apt-get install -y upx-ucl",
		verify: "command -v upx && upx --version | head -1",
	},
	{
		tool: "zeek",
		install: "sudo apt-get update && sudo apt-get install -y zeek",
		verify: "command -v zeek && zeek --version",
	},
] as const;
