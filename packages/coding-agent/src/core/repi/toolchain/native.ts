/** REPI tool bootstrap catalog: native. */
export const REPI_TOOL_BOOTSTRAP_CATALOG_NATIVE = [
	{
		tool: "checksec",
		install: "sudo apt-get update && sudo apt-get install -y checksec",
		verify: "command -v checksec && checksec --version || true",
	},
	{
		tool: "gdb",
		install: "sudo apt-get update && sudo apt-get install -y gdb",
		verify: "command -v gdb && gdb --version | head -1",
	},
	{
		tool: "strace",
		install: "sudo apt-get update && sudo apt-get install -y strace",
		verify: "command -v strace && strace --version | head -1",
	},
	{
		tool: "ltrace",
		install: "sudo apt-get update && sudo apt-get install -y ltrace",
		verify: "command -v ltrace && ltrace --version | head -1",
	},
	{
		tool: "radare2",
		install: "sudo apt-get update && sudo apt-get install -y radare2",
		verify: "command -v r2 && r2 -v | head -1",
	},
	{
		tool: "r2",
		install: "sudo apt-get update && sudo apt-get install -y radare2",
		verify: "command -v r2 && r2 -v | head -1",
	},
	{
		tool: "ghidra",
		install:
			"(sudo apt-get update && sudo apt-get install -y default-jdk unzip curl) || true; echo 'manual_tool_review ghidra: ensure JDK 21+, then download the latest ghidra_PUBLIC_<ver>.zip from https://github.com/NationalSecurityAgency/ghidra/releases, unzip to /opt, sudo ln -sf /opt/ghidra_*/ghidraRun /usr/local/bin/ghidra'",
		verify: "command -v ghidra || test -x /opt/ghidra_*/ghidraRun || true",
	},
	{
		tool: "binwalk",
		install: "sudo apt-get update && sudo apt-get install -y binwalk",
		verify: "command -v binwalk && binwalk --version | head -1",
	},
	{
		tool: "unblob",
		install: "python3 -m pip install --user unblob",
		verify: "command -v unblob && unblob --version | head -1",
	},
	{
		tool: "unsquashfs",
		install: "sudo apt-get update && sudo apt-get install -y squashfs-tools",
		verify: "command -v unsquashfs && unsquashfs -version | head -1",
	},
	{
		tool: "ubireader_extract_files",
		install: "python3 -m pip install --user ubi_reader",
		verify: "command -v ubireader_extract_files && ubireader_extract_files --help | head -1",
	},
	{
		tool: "qemu-mips",
		install: "sudo apt-get update && sudo apt-get install -y qemu-user-static qemu-system-mips",
		verify: "command -v qemu-mips || command -v qemu-mips-static",
	},
	{
		tool: "qemu-arm",
		install: "sudo apt-get update && sudo apt-get install -y qemu-user-static qemu-system-arm",
		verify: "command -v qemu-arm || command -v qemu-arm-static",
	},
	{
		tool: "ROPgadget",
		install: "python3 -m pip install --user ROPGadget",
		verify: "command -v ROPgadget && ROPgadget --help | head -1",
	},
	{
		tool: "angr",
		install:
			"python3 -m pip install --user angr || echo 'manual_tool_review angr: pip install failed (heavy native deps) — use the Phase 0 manual constraint-modeling fallback (objdump -d + python3 predicates/z3)'",
		verify: "command -v python3 && python3 -c 'import angr' >/dev/null 2>&1 && echo angr-ok || true",
	},
	{
		tool: "one_gadget",
		install: "gem install --user-install one_gadget",
		verify: "command -v one_gadget && one_gadget --version",
	},
	{
		tool: "patchelf",
		install: "sudo apt-get update && sudo apt-get install -y patchelf",
		verify: "command -v patchelf && patchelf --version",
	},
	{
		tool: "nm",
		install: "sudo apt-get update && sudo apt-get install -y binutils",
		verify: "command -v nm && nm --version | head -1",
	},
	{
		tool: "pwn",
		install: "python3 -m pip install --user pwntools",
		verify: "command -v pwn && pwn version || python3 - <<'PYPWN'\nimport pwn; print(pwn.__version__)\nPYPWN",
	},
] as const;
