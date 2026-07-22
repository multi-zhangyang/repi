/** Failure-repair domain appenders (replay/autofix/operator) with reverse domain next. */

export { appendRuntimeFailureRepairFromAutofix } from "./ledger-domain-autofix.ts";
export { appendRuntimeFailureRepairFromOperator } from "./ledger-domain-operator.ts";
export { appendRuntimeFailureRepairFromReplay } from "./ledger-domain-replay.ts";
