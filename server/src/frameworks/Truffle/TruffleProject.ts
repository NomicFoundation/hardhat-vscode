/* eslint-disable @typescript-eslint/no-explicit-any */
import { DidChangeWatchedFilesParams } from "vscode-languageserver-protocol";
import { OpenDocuments, ServerState } from "../../types";
import { CompilationDetails } from "../base/CompilationDetails";
import { Project } from "../base/Project";
import { Remapping } from "../base/Remapping";

export class TruffleProject extends Project {
  public priority = 3;
  public sourcesPath!: string;
  public remappings: Remapping[] = [];
  public initializeError?: string;
  public configSolcVersion?: string;

  constructor(
    serverState: ServerState,
    basePath: string,
    public configPath: string
  ) {
    super(serverState, basePath);
  }

  public id(): string {
    return this.configPath;
  }

  public frameworkName(): string {
    return "Truffle";
  }

  public async initialize(): Promise<void> {
    //
  }

  public async fileBelongs(file: string): Promise<boolean> {
    return false;
  }

  public resolveImportPath(
    file: string,
    importPath: string
  ): Promise<string | undefined> {
    throw new Error("Method not implemented.");
  }

  public buildCompilation(
    sourceUri: string,
    openDocuments: OpenDocuments
  ): Promise<CompilationDetails> {
    throw new Error("Method not implemented.");
  }

  public async onWatchedFilesChanges(
    params: DidChangeWatchedFilesParams
  ): Promise<void> {
    return;
  }
}
