import { IndexFileData } from "@common/event";
import {
  Node,
  DocumentsAnalyzerMap,
  DocumentAnalyzer as IDocumentAnalyzer,
} from "@common/types";
import { WorkspaceFileRetriever } from "./WorkspaceFileRetriever";
import { Logger } from "@utils/Logger";
import { WorkspaceFolder } from "vscode-languageserver-protocol";
import { decodeUriAndRemoveFilePrefix } from "../../utils/index";
import { DocumentAnalyzer } from "./DocumentAnalyzer";
import { Connection } from "vscode-languageserver";

export class Analyzer {
  workspaceFolders: WorkspaceFolder[];
  workspaceFileRetriever: WorkspaceFileRetriever;
  connection: Connection;
  logger: Logger;

  documentsAnalyzer: DocumentsAnalyzerMap = {};

  constructor(
    workspaceFileRetriever: WorkspaceFileRetriever,
    connection: Connection,
    logger: Logger
  ) {
    this.workspaceFolders = [];
    this.connection = connection;
    this.workspaceFileRetriever = workspaceFileRetriever;
    this.logger = logger;
  }

  public async init(workspaceFolders: WorkspaceFolder[]): Promise<Analyzer> {
    if (workspaceFolders.some((wf) => wf.uri.includes("\\"))) {
      throw new Error("Unexpect windows style path");
    }

    this.workspaceFolders = workspaceFolders;

    this.logger.info("Starting workspace indexing ...");
    this.logger.info("Scanning workspace for sol files");

    for (const workspaceFolder of workspaceFolders) {
      await this.scanForHardhatProjects(workspaceFolder);

      this.indexSolFiles(workspaceFolder);
    }

    this.logger.info("File indexing complete");

    return this;
  }

  private async scanForHardhatProjects(workspaceFolder: WorkspaceFolder) {
    const uri = decodeUriAndRemoveFilePrefix(workspaceFolder.uri);

    const hardhatConfigFiles = await this.workspaceFileRetriever.findFiles(
      uri,
      "**/hardhat.config.{ts,js}"
    );

    return hardhatConfigFiles;
  }

  private indexSolFiles(workspaceFolder: WorkspaceFolder) {
    try {
      const rootPath = decodeUriAndRemoveFilePrefix(workspaceFolder.uri);

      const documentsUri: string[] = [];

      this.workspaceFileRetriever.findSolFiles(
        rootPath,
        documentsUri,
        this.logger
      );
      // this.workspaceFileRetriever.findSolFiles(
      //   BROWNIE_PACKAGE_PATH,
      //   documentsUri,
      //   this.logger
      // );
      this.logger.info(`Scan complete, ${documentsUri.length} sol files found`);

      // Init all documentAnalyzers
      for (const documentUri of documentsUri) {
        this.documentsAnalyzer[documentUri] = new DocumentAnalyzer(
          rootPath,
          documentUri,
          this.logger
        );
      }

      this.logger.info("File indexing starting");

      if (documentsUri.length > 0) {
        // We will initialize all DocumentAnalizers first, because when we analyze documents we enter to their imports and
        // if they are not analyzed we analyze them, in order to be able to analyze imports we need to have DocumentAnalizer and
        // therefore we initiate everything first. The isAnalyzed serves to check if the document was analyzed so we don't analyze the document twice.
        for (let i = 0; i < documentsUri.length; i++) {
          const documentUri = documentsUri[i];

          try {
            const documentAnalyzer = this.getDocumentAnalyzer(documentUri);

            const data: IndexFileData = {
              path: documentUri,
              current: i + 1,
              total: documentsUri.length,
            };

            this.connection.sendNotification("custom/indexing-file", data);

            this.logger.trace("Indexing file", data);

            if (!documentAnalyzer.isAnalyzed) {
              documentAnalyzer.analyze(this.documentsAnalyzer);
            }
          } catch (err) {
            this.logger.error(err);
            this.logger.trace("Analysis of file failed", { documentUri });
          }
        }
      } else {
        const data: IndexFileData = {
          path: "",
          current: 0,
          total: 0,
        };

        this.connection.sendNotification("custom/indexing-file", data);
        this.logger.trace("No files to index", data);
      }
    } catch (err) {
      this.logger.error(err);
    }
  }

  /**
   * Get or create and get DocumentAnalyzer.
   *
   * @param uri The path to the file with the document.
   * Uri needs to be decoded and without the "file://" prefix.
   */
  public getDocumentAnalyzer(uri: string): IDocumentAnalyzer {
    let documentAnalyzer = this.documentsAnalyzer[uri];

    if (!documentAnalyzer) {
      const rootPath = this.resolveRootPath(uri);

      if (!rootPath) {
        throw new Error(
          "Document analyzer can't be retrieved as root path not set."
        );
      }

      documentAnalyzer = new DocumentAnalyzer(rootPath, uri, this.logger);
      this.documentsAnalyzer[uri] = documentAnalyzer;
    }

    return documentAnalyzer;
  }

  /**
   * @param uri The path to the file with the document.
   */
  public analyzeDocument(document: string, uri: string): Node | undefined {
    const documentAnalyzer = this.getDocumentAnalyzer(uri);
    return documentAnalyzer.analyze(this.documentsAnalyzer, document);
  }

  public resolveRootPath(uri: string): string | null {
    for (const workspaceFolder of this.workspaceFolders) {
      if (uri.startsWith(decodeUriAndRemoveFilePrefix(workspaceFolder.uri))) {
        return workspaceFolder.uri;
      }
    }

    return null;
  }
}
