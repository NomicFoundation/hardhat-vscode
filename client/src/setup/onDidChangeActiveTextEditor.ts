import { TextEditor } from "vscode";
import { ExtensionState } from "../types";
import {
  clearHardhatConfigState,
  updateHardhatProjectLanguageItem,
} from "../languageitems/hardhatProject";

export function onDidChangeActiveTextEditor(extensionState: ExtensionState) {
  return async (e: TextEditor | undefined) => {
    if (!e || e.document?.languageId !== "solidity") {
      return clearHardhatConfigState(extensionState);
    }

    return updateHardhatProjectLanguageItem(extensionState, {
      uri: e.document.uri.path,
    });
  };
}
