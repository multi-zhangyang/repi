/** Browser authz/static/schema signal collection. */
import { interestingLines, truncateMiddle } from "../../../text.ts";

export function collectBrowserAuthzSignals(
	combined: string,
	findings: string[],
): {
	authzStateLines: string[];
	authzSequenceLines: string[];
	authzOwnershipLines: string[];
	authzRollbackLines: string[];
	webAuthzStaticLines: string[];
	webSchemaLines: string[];
	webStateSourceLines: string[];
} {
	const authzStateLines = interestingLines(combined, /\[authz-state\]|\[authz-state-machine\]/i, 20);
	if (authzStateLines.length > 0) {
		findings.push(
			`browser authz state machine anchors: ${authzStateLines.map((line: any) => truncateMiddle(line, 200)).join(" | ")}`,
		);
	}
	const authzSequenceLines = interestingLines(combined, /\[authz-sequence\]|\[authz-sequence-artifact\]/i, 16);
	if (authzSequenceLines.length > 0) {
		findings.push(
			`browser authz sequence replay anchors: ${authzSequenceLines.map((line: any) => truncateMiddle(line, 200)).join(" | ")}`,
		);
	}
	const authzOwnershipLines = interestingLines(combined, /\[authz-ownership\]|\[authz-ownership-candidate\]/i, 18);
	if (authzOwnershipLines.length > 0) {
		findings.push(
			`browser authz object ownership anchors: ${authzOwnershipLines.map((line: any) => truncateMiddle(line, 200)).join(" | ")}`,
		);
	}
	const authzRollbackLines = interestingLines(combined, /\[authz-rollback\]/i, 12);
	if (authzRollbackLines.length > 0) {
		findings.push(
			`browser authz state rollback anchors: ${authzRollbackLines.map((line: any) => truncateMiddle(line, 200)).join(" | ")}`,
		);
	}
	const webAuthzStaticLines = interestingLines(
		combined,
		/\[web-authz-static\]|\[web-authz-risk\]|\[web-authz-static-summary\]/i,
		22,
	);
	if (webAuthzStaticLines.length > 0) {
		findings.push(
			`web API static authz source anchors: ${webAuthzStaticLines.map((line: any) => truncateMiddle(line, 200)).join(" | ")}`,
		);
	}
	const webSchemaLines = interestingLines(
		combined,
		/\[web-schema\]|\[web-schema-route\]|\[web-schema-risk\]|\[web-schema-graphql\]/i,
		22,
	);
	if (webSchemaLines.length > 0) {
		findings.push(
			`web API schema/auth parameter anchors: ${webSchemaLines.map((line: any) => truncateMiddle(line, 200)).join(" | ")}`,
		);
	}
	const webStateSourceLines = interestingLines(combined, /\[web-state-source\]|\[web-state-risk\]/i, 22);
	if (webStateSourceLines.length > 0) {
		findings.push(
			`web API state mutation source anchors: ${webStateSourceLines.map((line: any) => truncateMiddle(line, 200)).join(" | ")}`,
		);
	}
	return {
		authzStateLines,
		authzSequenceLines,
		authzOwnershipLines,
		authzRollbackLines,
		webAuthzStaticLines,
		webSchemaLines,
		webStateSourceLines,
	};
}
