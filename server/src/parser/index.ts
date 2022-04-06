import { Analyzer } from "@analyzer/index";
import { compilerProcessFactory } from "../services/validation/compilerProcessFactory";
import { WorkspaceFileRetriever } from "@analyzer/WorkspaceFileRetriever";
import { Logger } from "@utils/Logger";
import { WorkspaceFolder } from "vscode-languageserver-protocol";
import { Connection } from "vscode-languageserver";

export class LanguageService {
  analyzer: Analyzer;

  constructor(
    compProcessFactory: typeof compilerProcessFactory,
    workspaceFileRetriever: WorkspaceFileRetriever,
    connection: Connection,
    logger: Logger
  ) {
    this.analyzer = new Analyzer(workspaceFileRetriever, connection, logger);
  }

  async init(workspaceFolders: WorkspaceFolder[]): Promise<void> {
    await this.analyzer.init(workspaceFolders);
  }
}
