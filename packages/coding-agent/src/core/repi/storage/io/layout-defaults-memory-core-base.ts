/** REPI storage default core memory seed files (base journals/core). */
import {
	caseMemoryPath,
	memoryContradictionLedgerPath,
	memoryCorePath,
	memoryDistillationReportPath,
	memoryEventsPath,
	memoryPath,
	memoryPatternBookPath,
	memoryProceduralPath,
	memoryProjectPath,
	memoryQuarantinePath,
	memoryRetrievalReportPath,
	memorySemanticIndexPath,
} from "../paths.ts";

export function repiStorageMemoryCoreBaseDefaultEntries(): Array<[string, string]> {
	return [
		[memoryPath("field-journal.md"), "# REPI Field Journal\n\n"],
		[memoryPath("case-index.md"), "# REPI Case Index\n\n"],
		[memoryPath("evolution-log.md"), "# REPI Evolution Log\n\n"],
		[
			memoryCorePath(),
			"# REPI Core Memory\n\n固定偏好、项目不变量、长期稳定事实写在这里；保持短小，默认随 scoped memory packet 加载。\n\n",
		],
		[
			memoryProjectPath(),
			"# REPI Project Memory\n\n当前 workspace 的构建、运行、测试、入口、常用命令写在这里；避免写临时任务输出。\n\n",
		],
		[
			memoryProceduralPath(),
			"# REPI Procedural Memory\n\n可复用 workflow / checklist / verified command template 写在这里；不要写未验证猜测。\n\n",
		],
		[memoryEventsPath(), ""],
		[caseMemoryPath(), ""],
		[
			memoryRetrievalReportPath(),
			`${JSON.stringify({ kind: "repi-memory-retrieval-report", schemaVersion: 1, query: "", hits: [] }, null, 2)}\n`,
		],
		[
			memoryDistillationReportPath(),
			`${JSON.stringify({ kind: "repi-memory-distillation-report", schemaVersion: 1, patterns: [], quarantine: [] }, null, 2)}\n`,
		],
		[memoryPatternBookPath(), "# REPI Memory Pattern Book\n\n"],
		[
			memoryQuarantinePath(),
			`${JSON.stringify({ kind: "repi-memory-contamination-quarantine", schemaVersion: 1, findings: [] }, null, 2)}\n`,
		],
		[
			memorySemanticIndexPath(),
			`${JSON.stringify({ kind: "repi-memory-semantic-index", schemaVersion: 1, entries: [] }, null, 2)}\n`,
		],
		[memoryContradictionLedgerPath(), ""],
	];
}
