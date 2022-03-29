import { workspace, TextDocument } from "vscode";

export function getUnsavedDocuments(): TextDocument[] {
  return workspace.textDocuments.filter((i) => i.isDirty);
}
