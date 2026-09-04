import {
  Position as VSCodePosition,
  WorkspaceEdit,
  DocumentHighlight,
  TextEdit,
  Range,
  DocumentHighlightKind,
  MarkupKind,
  Definition,
  Hover,
  Location as VSCodeLocation,
  CompletionList,
  CompletionItem,
  CompletionItemKind,
  Diagnostic,
  DiagnosticSeverity,
  SignatureHelp,
  SignatureInformation,
  ParameterInformation,
} from "vscode-languageserver-protocol";

import { TextDocument } from "vscode-languageserver-textdocument";
import { Project } from "../../../frameworks/base/Project";

export {
  TextDocument,
  VSCodePosition,
  WorkspaceEdit,
  DocumentHighlight,
  TextEdit,
  Range,
  DocumentHighlightKind,
  MarkupKind,
  Definition,
  Hover,
  VSCodeLocation,
  CompletionList,
  CompletionItem,
  CompletionItemKind,
  Diagnostic,
  DiagnosticSeverity,
  SignatureHelp,
  SignatureInformation,
  ParameterInformation,
};

export enum SolFileState {
  UNLOADED = "UNLOADED",
  LOADED = "LOADED",
  ERRORED = "ERRORED",
}

export interface SolProjectMap {
  [key: string]: Project;
}

export interface ISolFileEntry {
  /**
   * The path to the file with the document we are analyzing.
   * Uri needs to be decoded and without the "file://" prefix.
   */
  uri: string;

  /**
   * The contents of the file.
   */
  text: string | undefined;

  project: Project;

  /**
   * The status of the sol file entry.
   */
  status: SolFileState;

  /**
   * Has the file been loaded, allowing operations on it.
   */
  isAnalyzed(): boolean;

  /**
   * Local means the file is part of the project's scope, and not external, dependency or library
   */
  isLocal: boolean;
}

/**
 *  Position in file.
 */
export interface Position {
  line: number;
  column: number;
}

/**
 *  Location in file has start and end Position.
 */
export interface Location {
  start: Position;
  end: Position;
}

/**
 * documentsAnalyzer Map { [uri: string]: DocumentAnalyzer } have all documentsAnalyzer class instances used for handle imports on first project start.
 */
export interface SolFileIndexMap {
  [uri: string]: ISolFileEntry;
}
