/** Operation step handlers: reverse runtime tools (run-first defaults). */
import type { ExtensionAPI } from "../extensions/types.ts";
import { tryExecuteOperationReverseAdapterStep } from "./operation-step-reverse-adapter.ts";
import { tryExecuteOperationReverseNativeStep } from "./operation-step-reverse-native.ts";
import { tryExecuteOperationReverseProofStep } from "./operation-step-reverse-proof.ts";
import { tryExecuteOperationReverseWebStep } from "./operation-step-reverse-web.ts";
import type { OperationExecution } from "./operator-step.ts";

type Done = (output: string) => OperationExecution;

export async function tryExecuteOperationReverseStep(
	pi: ExtensionAPI,
	command: string,
	target: string | undefined,
	done: Done,
): Promise<OperationExecution | undefined> {
	// run-first reverse domains: web → native/exploit → proof chain
	return (
		(await tryExecuteOperationReverseAdapterStep(pi, command, target, done)) ??
		(await tryExecuteOperationReverseWebStep(pi, command, target, done)) ??
		(await tryExecuteOperationReverseNativeStep(pi, command, target, done)) ??
		(await tryExecuteOperationReverseProofStep(pi, command, target, done))
	);
}
