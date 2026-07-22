/** Legacy `memory-notes.ts` surface — product memory removed; test/historical stubs. */

export function isValidNoteName(name: string): boolean {
	return Boolean(name && !/[/]/.test(name));
}
export function listNotes(..._args: any[]): any[] {
	return [];
}
export function readNote(..._args: any[]): any {
	return { type: "note", body: "", description: "" };
}
export function writeNote(..._args: any[]): { ok: boolean; path: string } {
	return { ok: true, path: "memory/notes/stub.md" };
}
export function deleteNote(..._args: any[]): { ok: boolean } {
	return { ok: true };
}
export function noteIndexForInjection(..._args: any[]): string {
	return "";
}
export function readNoteIndexText(..._args: any[]): string {
	return "";
}
export function rebuildNoteIndex(..._args: any[]): void {}
