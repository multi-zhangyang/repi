/** MITRE/CWE taxonomy types. */
export interface MitreTechnique {
	/** ATT&CK Technique ID, e.g. "T1059.004". */
	id: string;
	/** Technique name, e.g. "Command and Scripting Interpreter: Unix Shell". */
	name: string;
	/** Parent tactic name(s), e.g. "Execution". */
	tactics: string[];
}

export interface CweEntry {
	/** CWE ID, e.g. "CWE-78". */
	id: string;
	/** Short title, e.g. "Improper Neutralization of OS Command". */
	title: string;
}
