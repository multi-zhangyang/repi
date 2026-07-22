/** Host r2 mitigation fingerprint CAP for native reverse. */
export const NATIVE_R2_MITIGATION_LINES: string[] = [
	'if [ -n "$TARGET" ] && [ -e "$TARGET" ] && command -v r2 >/dev/null 2>&1; then',
	'  r2 -qq -c "iI; q" "$TARGET" 2>&1 | sed "s/^/[native-r2] /"',
	'  R2I=$(r2 -qq -c "iI; q" "$TARGET" 2>/dev/null)',
	'  printf "%s\\n" "$R2I" | awk \'/^nx[[:space:]]/ {print "[native-r2-mitigation] nx="$2}\'',
	'  printf "%s\\n" "$R2I" | awk \'/^pic[[:space:]]/ {print "[native-r2-mitigation] pie="$2}\'',
	'  printf "%s\\n" "$R2I" | awk \'/^canary[[:space:]]/ {print "[native-r2-mitigation] canary="$2}\'',
	'  printf "%s\\n" "$R2I" | awk \'/^relro[[:space:]]/ {print "[native-r2-mitigation] relro="$2}\'',
	"fi",
];
