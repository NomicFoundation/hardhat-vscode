import _ from "lodash";
import path from "path";
import {
  CodeAction,
  CompletionItem,
  Diagnostic,
  DidChangeWatchedFilesParams,
  Position,
} from "vscode-languageserver-protocol";
import { TextDocument } from "vscode-languageserver-textdocument";
import { OpenDocuments, ServerState } from "../../../types";
import { Logger } from "../../../utils/Logger";
import { FileBelongsResult, Project } from "../../base/Project";
import { CompilationDetails } from "../../base/CompilationDetails";
import { directoryContains } from "../../../utils/directoryContains";

export class Hardhat3Project extends Project {
  public priority = 5;

  private logger: Logger;

  constructor(
    serverState: ServerState,
    basePath: string,
    public configPath: string
  ) {
    super(serverState, basePath);
    this.logger = _.clone(serverState.logger);
    this.logger.tag = path.basename(basePath);
  }

  public id(): string {
    return this.configPath;
  }

  public frameworkName(): string {
    return "Hardhat 3";
  }

  public async initialize(): Promise<void> {}

  public async fileBelongs(sourceURI: string): Promise<FileBelongsResult> {
    return {
      belongs: directoryContains(this.basePath, sourceURI),
      isLocal: false,
    };
  }

  public async buildCompilation(
    sourceUri: string,
    openDocuments: OpenDocuments
  ): Promise<CompilationDetails> {
    throw new Error("Validation not ready for HH3");
  }

  public async onWatchedFilesChanges({
    changes,
  }: DidChangeWatchedFilesParams): Promise<void> {}

  public async resolveImportPath(from: string, importPath: string) {
    return undefined;
  }

  public invalidateBuildCache() {}

  public getImportCompletions(
    position: Position,
    currentImport: string
  ): CompletionItem[] {
    return [];
  }

  public resolveActionsFor(
    diagnostic: Diagnostic,
    document: TextDocument,
    uri: string
  ): CodeAction[] {
    return [];
  }
}
