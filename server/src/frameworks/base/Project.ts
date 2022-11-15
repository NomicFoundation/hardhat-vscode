import { DidChangeWatchedFilesParams } from "vscode-languageserver-protocol";
import { CompletionItem, Position } from "vscode-languageserver-types";
import { OpenDocuments, ServerState } from "../../types";
import { CompilationDetails } from "./CompilationDetails";

export abstract class Project {
  constructor(public serverState: ServerState, public basePath: string) {}

  public abstract configPath?: string;

  // Used for when multiple projects match for a sol file
  public abstract priority: number;

  // Unique identifier of a project
  public abstract id(): string;

  // Check if a solidity file belongs to this project
  public abstract fileBelongs(file: string): Promise<boolean>;

  // Resolve the full path of an import statement
  public abstract resolveImportPath(
    file: string,
    importPath: string
  ): Promise<string | undefined>;

  // Any tasks the project need to run to be in an operative state
  public abstract initialize(): Promise<void>;

  // Given a source file and open docs, get a solc build and version
  public abstract buildCompilation(
    sourceUri: string,
    openDocuments: OpenDocuments
  ): Promise<CompilationDetails>;

  // Callback for watched files events
  public abstract onWatchedFilesChanges(
    params: DidChangeWatchedFilesParams
  ): Promise<void>;

  public abstract frameworkName(): string;

  public invalidateBuildCache() {
    // to be overriden if necessary
  }

  public getImportCompletions(
    _position: Position,
    _currentImport: string
  ): CompletionItem[] {
    return [];
  }
}
