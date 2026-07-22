/** Native deep reverse capture followups. */
import { reverseDomainCaptureNextCommands } from "../../../reverse-capture.ts";

type LaneCommand = { label: string; command: string; evidence: string };

export function nativeDeepRerunFollowups(targetArg: string): LaneCommand[] {
	return [
		{
			label: "native-deep-symbol-map-rerun",
			command: `[ -x /tmp/repi-native-symbol-map.sh ] && /tmp/repi-native-symbol-map.sh ${targetArg} || file ${targetArg}; readelf -hW ${targetArg} 2>/dev/null; strings -a -n 5 ${targetArg} | head -220`,
			evidence: "rerun native deep symbol/import/section/string map",
		},
		{
			label: "native-deep-decompiler-rerun",
			command: `[ -x /tmp/repi-ghidra-import.sh ] && /tmp/repi-ghidra-import.sh ${targetArg} || r2 -A -q -c 'aaa; afl~main,sym.; iz~license,key,serial,valid,invalid,flag; q' ${targetArg}`,
			evidence: "rerun Ghidra/r2 decompiler control-flow scaffold",
		},
		{
			label: "native-deep-compare-trace-rerun",
			command: `[ -f /tmp/repi-native-compare-trace.gdb ] && gdb -q ${targetArg} -x /tmp/repi-native-compare-trace.gdb || gdb -q ${targetArg} -ex 'set pagination off' -ex 'break strcmp' -ex 'break memcmp' -ex 'run' -ex 'bt' -ex 'quit'`,
			evidence: "rerun native comparison breakpoint trace with narrowed inputs",
		},
		{
			label: "native-deep-symbolic-fuzz-rerun",
			command: `[ -f /tmp/repi-native-symbolic-fuzz.py ] && python3 /tmp/repi-native-symbolic-fuzz.py ${targetArg} || printf '%s\n' 'rerun native-deep-symbolic-fuzz-scaffold from re_lane plan'`,
			evidence: "rerun angr/CFG symbolic scaffold and bounded fuzz smoke tests",
		},
		{
			label: "native-deep-patch-report-scaffold",
			command:
				"python3 - <<'PY'\nimport json, pathlib\np=pathlib.Path('/tmp/repi-native-patch-candidates.json')\nprint('[native-patch-report] artifact=' + str(p) + ' exists=' + str(p.exists()))\nif p.exists():\n obj=json.loads(p.read_text()); print('[native-patch-report] target=' + str(obj.get('target')) + ' candidates=' + str(len(obj.get('candidates', []))))\nprint('Next: bind one compare/branch site to runtime trace, then prove byte patch or input constraint with replay.')\nPY",
			evidence: "consolidated native patch hypothesis report scaffold before byte mutation",
		},
	];
}

export function nativeDeepReverseFollowups(params: {
	combined: string;
	targetArg: string;
	findings: string[];
	followups: LaneCommand[];
}): void {
	const reverseCaptureOpen =
		!/proof_exit\s*=\s*(partial_runtime_capture|runtime_capture_strong)/i.test(params.combined) ||
		!/bind_ready\s*=\s*true/i.test(params.combined);
	if (!reverseCaptureOpen) return;
	params.findings.push(
		`[native-proof-capture] require proof.exit=partial_runtime_capture|runtime_capture_strong and bind_ready=true`,
	);
	const reverseNext = reverseDomainCaptureNextCommands({
		routeOrBlob: `native_deep ${params.targetArg}`,
		target: params.targetArg,
		includeGates: true,
	}).slice(0, 2);
	params.followups.push(
		{
			label: `native-domain-proof-exit`,
			command: `re_domain_proof_exit show`,
			evidence: "reverse runtime capture gate",
		},
		{
			label: `native-complete-audit`,
			command: `re_complete audit`,
			evidence: "reverse completion audit",
		},
		{
			label: `native-runtime-adapter`,
			command: `re_runtime_adapter run ${params.targetArg}`,
			evidence: "runtime adapter capture",
		},
		...reverseNext.map((cmd: any, index: any) => ({
			label: `native-reverse-domain-next-${index + 1}`,
			command: cmd,
			evidence: "reverse domain capture next",
		})),
	);
}
