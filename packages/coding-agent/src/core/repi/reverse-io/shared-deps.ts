/** Reverse I/O DI deps and passthroughs. */
/**
 * Reverse I/O shared deps and evidence write helpers.
 */
import { createHash } from "node:crypto";

export type ReverseIoDeps = {
	appendEvidence: (...args: any[]) => any;
	updateMissionCheckpoint: (...args: any[]) => any;
	latestCompilerArtifactPath: () => string | undefined;
	latestVerifierArtifactPath: () => string | undefined;
	latestReplayerArtifactPath: () => string | undefined;
	latestOperatorArtifactPath: () => string | undefined;
	latestContextPackArtifactPath: () => string | undefined;
	latestKernelArtifactPath: () => string | undefined;
	latestScopedMarkdownArtifact: (...args: any[]) => string | undefined;
};

let reverseIoDeps: ReverseIoDeps | null = null;

export function configureReverseIo(deps: ReverseIoDeps): void {
	reverseIoDeps = deps;
}

export function deps(): ReverseIoDeps {
	if (!reverseIoDeps) {
		throw new Error("reverse-io not configured; call configureReverseIo() from REPI kernel init");
	}
	return reverseIoDeps;
}

export function replayHash(text: string): string {
	return createHash("sha256").update(text).digest("hex");
}

export function appendEvidence(...args: any[]): any {
	return deps().appendEvidence(...args);
}

export function updateMissionCheckpoint(...args: any[]): any {
	return deps().updateMissionCheckpoint(...args);
}

export function latestCompilerArtifactPath(): string | undefined {
	return deps().latestCompilerArtifactPath();
}

export function latestVerifierArtifactPath(): string | undefined {
	return deps().latestVerifierArtifactPath();
}

export function latestReplayerArtifactPath(): string | undefined {
	return deps().latestReplayerArtifactPath();
}

export function latestOperatorArtifactPath(): string | undefined {
	return deps().latestOperatorArtifactPath();
}

export function latestContextPackArtifactPath(): string | undefined {
	return deps().latestContextPackArtifactPath();
}

export function latestKernelArtifactPath(): string | undefined {
	return deps().latestKernelArtifactPath();
}

export function latestScopedMarkdownArtifact(...args: any[]): string | undefined {
	return deps().latestScopedMarkdownArtifact(...args);
}
