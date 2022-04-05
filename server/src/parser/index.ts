import * as events from "events";
import { Analyzer } from "@analyzer/index";
import { SolidityNavigation } from "../services/navigation/SolidityNavigation";
import { SolidityCompletion } from "../services/completion/SolidityCompletion";
import { SolidityValidation } from "../services/validation/SolidityValidation";
import { compilerProcessFactory } from "../services/validation/compilerProcessFactory";
import { SoliditySignatureHelp } from "../services/documentation/SoliditySignatureHelp";
import { WorkspaceFileRetriever } from "@analyzer/WorkspaceFileRetriever";
import { Logger } from "@utils/Logger";
import { SolidityRename } from "../services/rename/SolidityRename";
import { WorkspaceFolder } from "vscode-languageserver-protocol";

export class LanguageService {
  analyzer: Analyzer;
  solidityNavigation: SolidityNavigation;
  solidityCompletion: SolidityCompletion;
  solidityValidation: SolidityValidation;
  soliditySignatureHelp: SoliditySignatureHelp;
  solidityRename: SolidityRename;

  constructor(
    compProcessFactory: typeof compilerProcessFactory,
    workspaceFileRetriever: WorkspaceFileRetriever,
    em: events.EventEmitter,
    logger: Logger
  ) {
    this.analyzer = new Analyzer(workspaceFileRetriever, em, logger);
    this.solidityNavigation = new SolidityNavigation(this.analyzer);
    this.solidityCompletion = new SolidityCompletion(this.analyzer);
    this.solidityValidation = new SolidityValidation(
      this.analyzer,
      compProcessFactory,
      logger
    );
    this.soliditySignatureHelp = new SoliditySignatureHelp(this.analyzer);
    this.solidityRename = new SolidityRename(this.analyzer);
  }

  async init(workspaceFolders: WorkspaceFolder[]): Promise<void> {
    this.analyzer.init(workspaceFolders);
  }
}
