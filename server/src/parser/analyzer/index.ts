import * as events from "events";
import * as fs from "fs";
import * as parser from "@solidity-parser/parser";
import * as matcher from "@analyzer/matcher";
import { Searcher } from "@analyzer/searcher";
import { BROWNIE_PACKAGE_PATH } from "@analyzer/resolver";
import { IndexFileData } from "@common/event";
import {
  Node,
  SourceUnitNode,
  DocumentsAnalyzerMap,
  DocumentAnalyzer as IDocumentAnalyzer,
  ASTNode,
  EmptyNode,
  Searcher as ISearcher,
} from "@common/types";
import { WorkspaceFileRetriever } from "./WorkspaceFileRetriever";
import { Logger } from "@utils/Logger";
import { WorkspaceFolder } from "vscode-languageserver-protocol";
import { decodeUriAndRemoveFilePrefix } from "../../utils/index";

export class Analyzer {
  workspaceFolders: WorkspaceFolder[];
  em: events.EventEmitter;
  workspaceFileRetriever: WorkspaceFileRetriever;
  logger: Logger;

  documentsAnalyzer: DocumentsAnalyzerMap = {};

  constructor(
    workspaceFileRetriever: WorkspaceFileRetriever,
    em: events.EventEmitter,
    logger: Logger
  ) {
    this.workspaceFolders = [];
    this.em = em;
    this.workspaceFileRetriever = workspaceFileRetriever;
    this.logger = logger;
  }

  public init(workspaceFolders: WorkspaceFolder[]): Analyzer {
    if (workspaceFolders.some((wf) => wf.uri.includes("\\"))) {
      throw new Error("Unexpect windows style path");
    }

    this.workspaceFolders = workspaceFolders;

    this.indexSolFiles(this.workspaceFolders[0]);

    return this;
  }

  private indexSolFiles(workspaceFolder: WorkspaceFolder) {
    try {
      const rootPath = decodeUriAndRemoveFilePrefix(workspaceFolder.uri);

      const documentsUri: string[] = [];
      this.logger.info("Starting workspace indexing ...");

      this.logger.info("Scanning workspace for sol files");
      this.workspaceFileRetriever.findSolFiles(
        rootPath,
        documentsUri,
        this.logger
      );
      this.workspaceFileRetriever.findSolFiles(
        BROWNIE_PACKAGE_PATH,
        documentsUri,
        this.logger
      );
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

            this.em.emit("indexing-file", data);
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

        this.em.emit("indexing-file", data);
        this.logger.trace("No files to index", data);
      }

      this.logger.info("File indexing complete");
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

class DocumentAnalyzer implements IDocumentAnalyzer {
  private logger: Logger;
  rootPath: string;

  document: string | undefined;
  uri: string;

  ast: ASTNode | undefined;

  analyzerTree: { tree: Node };
  isAnalyzed = false;

  searcher: ISearcher;

  orphanNodes: Node[] = [];

  constructor(rootPath: string, uri: string, logger: Logger) {
    this.rootPath = rootPath;
    this.uri = uri;
    this.logger = logger;

    this.analyzerTree = {
      tree: new EmptyNode({ type: "Empty" }, this.uri, this.rootPath, {}),
    };

    this.searcher = new Searcher(this.analyzerTree);

    if (fs.existsSync(uri)) {
      this.document = "" + fs.readFileSync(uri);
    } else {
      this.document = "";
    }
  }

  public analyze(
    documentsAnalyzer: DocumentsAnalyzerMap,
    document?: string
  ): Node | undefined {
    try {
      this.orphanNodes = [];

      if (document) {
        this.document = document;
      }

      try {
        this.ast = parser.parse(this.document || "", {
          loc: true,
          range: true,
          tolerant: true,
        });
      } catch {
        return this.analyzerTree.tree;
      }

      if (this.isAnalyzed) {
        const oldDocumentsAnalyzerTree = this.analyzerTree
          .tree as SourceUnitNode;

        for (const importNode of oldDocumentsAnalyzerTree.getImportNodes()) {
          importNode.getParent()?.removeChild(importNode);
          importNode.setParent(undefined);
        }
      }

      this.isAnalyzed = true;
      this.analyzerTree.tree = matcher
        .find(this.ast, this.uri, this.rootPath, documentsAnalyzer)
        .accept(matcher.find, this.orphanNodes);

      return this.analyzerTree.tree;
    } catch (err) {
      this.logger.error(err);

      return this.analyzerTree.tree;
    }
  }
}
