/** REPI tool bootstrap catalog: mobile. */
export const REPI_TOOL_BOOTSTRAP_CATALOG_MOBILE = [
	{
		tool: "jadx",
		install: "sudo apt-get update && sudo apt-get install -y jadx",
		verify: "command -v jadx && jadx --version",
	},
	{
		tool: "apktool",
		install: "sudo apt-get update && sudo apt-get install -y apktool",
		verify: "command -v apktool && apktool --version",
	},
	{
		tool: "adb",
		install: "sudo apt-get update && sudo apt-get install -y adb",
		verify: "command -v adb && adb version | head -1",
	},
	{
		tool: "frida",
		install: "python3 -m pip install --user frida-tools",
		verify: "command -v frida && frida --version",
	},
	{
		tool: "objection",
		install: "python3 -m pip install --user objection",
		verify: "command -v objection && objection version | head -1",
	},
	{
		tool: "class-dump",
		install:
			"echo 'manual_tool_review class-dump: macOS only; install via brew install class-dump or build class-dump-swift from source (https://github.com/nygard/class-dump)'",
		verify: "command -v class-dump || command -v class-dump-swift || true",
	},
	{
		tool: "otool",
		install:
			"echo 'manual_tool_review otool: macOS only; install Xcode Command Line Tools via xcode-select --install'",
		verify: "command -v otool && otool -h 2>&1 | head -1 || true",
	},
	{
		tool: "codesign",
		install:
			"echo 'manual_tool_review codesign: macOS only; install Xcode Command Line Tools via xcode-select --install'",
		verify: "command -v codesign && codesign -h 2>&1 | head -1 || true",
	},
	{
		tool: "plutil",
		install:
			"sudo apt-get update && sudo apt-get install -y libplist-utils || echo 'manual_tool_review plutil: on macOS plutil ships with Xcode CLT; on Linux libplist-utils provides plutil'",
		verify: "command -v plutil && plutil -help 2>&1 | head -1 || true",
	},
] as const;
