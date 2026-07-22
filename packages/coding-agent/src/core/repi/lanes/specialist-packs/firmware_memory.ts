/** Specialist pack handlers: firmware/DFIR. */
import type { SpecialistPackContext } from "./types.ts";

export function applyWantsMemoryForensics(ctx: SpecialistPackContext): void {
	ctx.specialists.push("memory forensics");
	ctx.add(
		"memory-runtime-repi-bridge",
		ctx.target
			? `printf '%s\n' "re_runtime_adapter run ${ctx.targetArg}" "re_domain_proof_exit show" "re_complete audit"`
			: "printf '[memory-runtime-repi-bridge] target_missing\n'",
		"bridge memory forensics work to runtime adapter capture and proof.exit gates",
	);
	if (!ctx.target) {
		ctx.add(
			"memory-forensics-ctx.target-discovery",
			"find . -maxdepth 6 -type f \\( -iname '*.raw' -o -iname '*.vmem' -o -iname '*.mem' -o -iname '*.dmp' -o -iname '*.lime' -o -iname 'hiberfil.sys' -o -iname 'pagefile.sys' -o -iname '*.core' \\) -exec sh -c 'printf \"[mem-image-candidate] path=%s \" \"$1\"; file \"$1\"' _ {} \\; | head -120",
			"discover memory image candidates before volatility triage",
		);
	}
	ctx.add(
		"memory-forensics-image-info-scaffold",
		`cat > /tmp/repi-memory-info.sh <<'SH'\nset +e\nIMG="$1"\nprintf '[mem-image] ctx.target=%s\\n' "$IMG"\n[ -f "$IMG" ] || { printf '[mem-image] target_missing=%s\\n' "$IMG"; exit 0; }\nfile "$IMG" 2>/dev/null | sed 's/^/[mem-image] file=/'\nsha256sum "$IMG" 2>/dev/null | awk '{print "[mem-image] sha256="$1" path="$2}'\npython3 - <<'PY' "$IMG"\nimport hashlib, pathlib, sys\np=pathlib.Path(sys.argv[1]); data=p.read_bytes()[:1048576]\nprint('[mem-image]', 'sample_sha256=' + hashlib.sha256(data).hexdigest(), 'sample_bytes=' + str(len(data)))\nPY\nif command -v volatility3 >/dev/null 2>&1; then\n  for plug in windows.info linux.banners mac.banners; do timeout 45s volatility3 -f "$IMG" $plug 2>&1 | sed "s/^/[mem-vol-info] $plug /" | head -100; done\nelse\n  printf '[mem-vol-info] volatility3=missing bootstrap_hint=re_bootstrap plan volatility3\\n'\nfi\nSH\nchmod +x /tmp/repi-memory-info.sh\n/tmp/repi-memory-info.sh ${ctx.targetArg}`,
		"memory image hash/profile/banner inventory with volatility3 OS plugin fallbacks",
	);
	ctx.add(
		"memory-forensics-process-network-scaffold",
		`cat > /tmp/repi-memory-process.sh <<'SH'\nset +e\nIMG="$1"; [ -f "$IMG" ] || { printf '[mem-process] target_missing=%s\\n' "$IMG"; exit 0; }\nprintf '[mem-process] ctx.target=%s\\n' "$IMG"\nif command -v volatility3 >/dev/null 2>&1; then\n  for plug in windows.pslist windows.pstree windows.cmdline windows.dlllist windows.handles windows.netscan linux.pslist linux.pstree linux.sockstat mac.pslist mac.netstat; do\n    timeout 60s volatility3 -f "$IMG" $plug 2>&1 | sed "s/^/[mem-vol] $plug /" | head -140\n  done\nelse\n  strings -a -n 8 "$IMG" | grep -Eai 'cmd\\.exe|powershell|/bin/sh|bash|python|curl|wget|http|https|socket|connect|token|password' | head -260 | sed 's/^/[mem-strings] /'\nfi\nSH\nchmod +x /tmp/repi-memory-process.sh\n/tmp/repi-memory-process.sh ${ctx.targetArg}`,
		"memory process tree, command line, DLL/handle, and network/socket scaffold",
	);
	ctx.add(
		"memory-forensics-credential-artifact-scaffold",
		`cat > /tmp/repi-memory-creds.sh <<'SH'\nset +e\nIMG="$1"; [ -f "$IMG" ] || { printf '[mem-credential] target_missing=%s\\n' "$IMG"; exit 0; }\nprintf '[mem-credential] ctx.target=%s\\n' "$IMG"\nif command -v volatility3 >/dev/null 2>&1; then\n  for plug in windows.hashdump windows.lsadump windows.cachedump windows.registry.hivelist windows.registry.printkey windows.filescan; do\n    timeout 60s volatility3 -f "$IMG" $plug 2>&1 | sed "s/^/[mem-vol-credential] $plug /" | head -160\n  done\nfi\nstrings -a -n 6 "$IMG" | grep -Eai 'password|passwd|token|secret|Authorization:|Cookie:|AWS_ACCESS_KEY|BEGIN (RSA|OPENSSH)|NTLM|krbtgt|Mimikatz|lsass|Chrome|Firefox|keychain' | head -320 | sed 's/^/[mem-credential] /'\nSH\nchmod +x /tmp/repi-memory-creds.sh\n/tmp/repi-memory-creds.sh ${ctx.targetArg}`,
		"credential/token/registry/browser/LSASS artifact hunt with volatility and strings fallback",
	);
	ctx.add(
		"memory-forensics-vol3-quick-triage",
		ctx.target
			? `(command -v vol >/dev/null && vol -f ${ctx.targetArg} banners.Banners 2>/dev/null | sed 's/^/[mem-banner] /' | head -40; vol -f ${ctx.targetArg} windows.info.Info 2>/dev/null | sed 's/^/[mem-wininfo] /' | head -80; vol -f ${ctx.targetArg} windows.pslist.PsList 2>/dev/null | sed 's/^/[mem-pslist] /' | head -120; vol -f ${ctx.targetArg} windows.netscan.NetScan 2>/dev/null | sed 's/^/[mem-netscan] /' | head -120) || (command -v volatility3 >/dev/null && volatility3 -f ${ctx.targetArg} banners.Banners 2>/dev/null | head -40) || (strings -a -n 6 ${ctx.targetArg} | grep -Ei 'PASSWORD|HTTP/1\\.|Host: |Authorization: |Cookie: |PRIVATE KEY|BEGIN RSA|NTLM|Kerberos' | sed 's/^/[mem-string] /' | head -160)`
			: "printf '[mem-triage] target_missing\\n'; find . -maxdepth 5 -type f \\( -iname '*.raw' -o -iname '*.vmem' -o -iname '*.mem' -o -iname '*.dmp' \\) | head -40",
		"live volatility3 banners/info/pslist/netscan triage with strings credential fallback",
	);
	ctx.add(
		"memory-forensics-timeline-carve-scaffold",
		`cat > /tmp/repi-memory-timeline.sh <<'SH'\nset +e\nIMG="$1"; OUT="/tmp/repi-memory-artifacts"; mkdir -p "$OUT"\n[ -f "$IMG" ] || { printf '[mem-timeline] target_missing=%s\\n' "$IMG"; exit 0; }\nprintf '[mem-timeline] ctx.target=%s out=%s\\n' "$IMG" "$OUT"\nif command -v volatility3 >/dev/null 2>&1; then\n  for plug in timeliner windows.malfind windows.filescan windows.dumpfiles linux.malfind; do\n    timeout 90s volatility3 -f "$IMG" $plug --dump-dir "$OUT" 2>&1 | sed "s/^/[mem-vol-timeline] $plug /" | head -200\n  done\nfi\nfind "$OUT" -maxdepth 2 -type f -print -exec file {} \\; 2>/dev/null | head -200 | sed 's/^/[mem-carve] /'\nSH\nchmod +x /tmp/repi-memory-timeline.sh\n/tmp/repi-memory-timeline.sh ${ctx.targetArg}`,
		"memory timeline, malfind, filescan/dumpfiles and carved artifact scaffold",
	);
}
