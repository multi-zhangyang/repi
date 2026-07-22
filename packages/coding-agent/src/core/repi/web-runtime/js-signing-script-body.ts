/** JS signing node script body (reverse proof capture tags). */

import { jsSigningScriptDeepBody } from "./js-signing-script-deep.ts";
import { jsSigningScriptExtraBody } from "./js-signing-script-extra.ts";
import { jsSigningScriptPrelude, jsSigningScriptProofFooter } from "./js-signing-script-helpers.ts";
import { JS_SIGNING_JWT_DEEP_LINES } from "./js-signing-script-jwt-deep.ts";
import { jsSigningScriptScanBody } from "./js-signing-script-scan.ts";

export function jsSigningNodeScript(): string {
	return [
		...jsSigningScriptPrelude(),
		...jsSigningScriptScanBody(),
		...jsSigningScriptDeepBody(),
		...jsSigningScriptExtraBody(),
		...JS_SIGNING_JWT_DEEP_LINES,
		...jsSigningScriptProofFooter(),
	].join("\n");
}
