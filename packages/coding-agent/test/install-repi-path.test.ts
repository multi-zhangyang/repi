import { spawnSync } from "node:child_process";
import {
	chmodSync,
	existsSync,
	lstatSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	readlinkSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const INSTALL_REPI = fileURLToPath(new URL("../../../scripts/reverse-agent/install-repi.sh", import.meta.url));
const NODE_BIN_DIR = dirname(process.execPath);

function countOccurrences(haystack: string, needle: string): number {
	return haystack.split(needle).length - 1;
}

describe("install-repi launcher PATH setup", () => {
	let tempRoot: string;
	let fakeRoot: string;
	let home: string;

	beforeEach(() => {
		tempRoot = mkdtempSync(join(tmpdir(), "repi-install-path-"));
		fakeRoot = join(tempRoot, "repo");
		home = join(tempRoot, "home");
		mkdirSync(join(fakeRoot, "scripts", "reverse-agent"), { recursive: true });
		mkdirSync(home, { recursive: true });

		const fakeRepi = join(fakeRoot, "repi");
		writeFileSync(
			fakeRepi,
			[
				"#!/usr/bin/env bash",
				'if [ "$1" = "--offline" ] && [ "$2" = "--help" ]; then',
				"  exit 0",
				"fi",
				"exit 0",
				"",
			].join("\n"),
		);
		chmodSync(fakeRepi, 0o755);

		writeFileSync(join(fakeRoot, "scripts", "reverse-agent", "init-repi-profile.mjs"), "process.exit(0);\n");
	});

	afterEach(() => {
		rmSync(tempRoot, { recursive: true, force: true });
	});

	function runInstaller() {
		return spawnSync("bash", [INSTALL_REPI, "--root", fakeRoot, "--user"], {
			encoding: "utf8",
			env: {
				PATH: `${NODE_BIN_DIR}:/usr/bin:/bin`,
				HOME: home,
				SHELL: "/bin/bash",
				REPI_CODING_AGENT_DIR: join(tempRoot, "agent"),
				SUDO_USER: "",
			},
			timeout: 10_000,
		});
	}

	it("creates ~/.local/bin/repi and adds the missing PATH export for future shells", () => {
		const result = runInstaller();
		expect(result.status, `${result.stderr}\n${result.stdout}`).toBe(0);

		const launcher = join(home, ".local", "bin", "repi");
		expect(lstatSync(launcher).isSymbolicLink()).toBe(true);
		expect(readlinkSync(launcher)).toBe(join(fakeRoot, "repi"));

		const pathLine = `export PATH="${join(home, ".local", "bin")}:$PATH"`;
		const bashrc = readFileSync(join(home, ".bashrc"), "utf8");
		const profile = readFileSync(join(home, ".profile"), "utf8");
		expect(bashrc).toContain("# Added by repi install");
		expect(bashrc).toContain(pathLine);
		expect(profile).toContain(pathLine);
		expect(result.stdout).toContain("Successfully added repi to $PATH in ~/.bashrc");
		expect(result.stdout).toContain("source ~/.bashrc  # Load new PATH (or open a new terminal)");
	});

	it("does not duplicate PATH exports when the installer is re-run", () => {
		const first = runInstaller();
		expect(first.status, `${first.stderr}\n${first.stdout}`).toBe(0);
		const second = runInstaller();
		expect(second.status, `${second.stderr}\n${second.stdout}`).toBe(0);
		expect(second.stdout).toContain("Successfully added repi to $PATH in ~/.bashrc");
		expect(second.stdout).not.toContain("add it to $PATH for direct command use");

		const pathLine = `export PATH="${join(home, ".local", "bin")}:$PATH"`;
		const bashrc = readFileSync(join(home, ".bashrc"), "utf8");
		const profile = readFileSync(join(home, ".profile"), "utf8");
		expect(countOccurrences(bashrc, pathLine)).toBe(1);
		expect(countOccurrences(profile, pathLine)).toBe(1);
	});

	it("skips rc edits when the selected launcher directory is already on PATH", () => {
		const binDir = join(tempRoot, "bin");
		mkdirSync(binDir, { recursive: true });
		const result = spawnSync("bash", [INSTALL_REPI, "--root", fakeRoot, "--bin-dir", binDir], {
			encoding: "utf8",
			env: {
				PATH: `${NODE_BIN_DIR}:${binDir}:/usr/bin:/bin`,
				HOME: home,
				SHELL: "/bin/bash",
				REPI_CODING_AGENT_DIR: join(tempRoot, "agent"),
				SUDO_USER: "",
			},
			timeout: 10_000,
		});
		expect(result.status, `${result.stderr}\n${result.stdout}`).toBe(0);
		expect(lstatSync(join(binDir, "repi")).isSymbolicLink()).toBe(true);
		expect(existsSync(join(home, ".bashrc"))).toBe(false);
		expect(existsSync(join(home, ".profile"))).toBe(false);
		expect(result.stdout).not.toContain("PATH hint");
		expect(result.stdout).not.toContain("Shell startup files updated");
	});
});
