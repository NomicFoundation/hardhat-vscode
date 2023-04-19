import fs from "fs";
import _ from "lodash";
import path from "path";
import { DidChangeWatchedFilesParams } from "vscode-languageserver-protocol";
import { OpenDocuments, ServerState } from "../../types";
import { toUnixStyle } from "../../utils";
import { CompilationDetails } from "../base/CompilationDetails";
import { Project } from "../base/Project";
import { buildBasicCompilation } from "../shared/buildBasicCompilation";

export class ProjectlessProject extends Project {
  // These are in place just to implement ISolProject. Should be removed after refactor
  public configPath = undefined;

  public priority = 0;

  constructor(serverState: ServerState, basePath: string) {
    super(serverState, basePath);
  }

  public id(): string {
    return "projectless";
  }

  public frameworkName(): string {
    return "None";
  }

  public async initialize(): Promise<void> {
    return;
  }

  public async fileBelongs(_file: string) {
    return { belongs: true, isLocal: false };
  }

  public async resolveImportPath(file: string, importPath: string) {
    try {
      const resolvedPath = require.resolve(importPath, {
        paths: [fs.realpathSync(path.dirname(file))],
      });

      return toUnixStyle(fs.realpathSync(resolvedPath));
    } catch (error) {
      return undefined;
    }
  }

  public async buildCompilation(
    sourceUri: string,
    openDocuments: OpenDocuments
  ): Promise<CompilationDetails> {
    return buildBasicCompilation(this, sourceUri, openDocuments);
  }

  public async onWatchedFilesChanges(
    _params: DidChangeWatchedFilesParams
  ): Promise<void> {
    return;
  }
}
