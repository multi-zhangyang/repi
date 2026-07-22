/** Autofix queue collectors from replay/compiler/feedback. */
export type { AutofixCollectCtx } from "./build-core-collect-types.ts";

import { collectAutofixBlockedQueues } from "./build-core-collect-blocked.ts";
import { collectAutofixFailedQueues } from "./build-core-collect-failed.ts";
import { collectAutofixFeedbackQueues } from "./build-core-collect-feedback.ts";
import { collectAutofixGapQueues } from "./build-core-collect-gaps.ts";
import type { AutofixCollectCtx } from "./build-core-collect-types.ts";

export function collectAutofixQueues(ctx: AutofixCollectCtx): void {
	collectAutofixBlockedQueues(ctx);
	collectAutofixFailedQueues(ctx);
	collectAutofixFeedbackQueues(ctx);
	collectAutofixGapQueues(ctx);
}
