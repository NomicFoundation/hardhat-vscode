import * as fs from "fs";
import * as path from "path";
import * as parser from "@solidity-parser/parser";

import * as matcher from "@analyzer/matcher";
import { Searcher } from "@analyzer/searcher";
import { BROWNIE_PACKAGE_PATH } from "@analyzer/resolver";
import { IndexFileData, eventEmitter as em } from "@common/event";
import {
  Node,
  SourceUnitNode,
  DocumentsAnalyzerMap,
  DocumentAnalyzer as IDocumentAnalyzer,
  ASTNode,
  EmptyNode,
  Searcher as ISearcher,
} from "@common/types";
import { Logger } from "@utils/Logger";

export class Analyzer {
  rootPath: string;
  logger: Logger;

  documentsAnalyzer: DocumentsAnalyzerMap = {};

  constructor(rootPath: string, logger: Logger) {
    this.rootPath = rootPath;
    this.logger = logger;

    const documentsUri: string[] = [];

    this.indexSolFiles(documentsUri);
  }

  private indexSolFiles(documentsUri: string[]) {
    try {
      this.logger.info("Starting workspace indexing ...");

      this.logger.info("Scanning workspace for sol files");
      this.findSolFiles(this.rootPath, documentsUri);
      this.findSolFiles(BROWNIE_PACKAGE_PATH, documentsUri);
      this.logger.info(`Scan complete, ${documentsUri.length} sol files found`);

      // Init all documentAnalyzers
      for (const documentUri of documentsUri) {
        this.documentsAnalyzer[documentUri] = new DocumentAnalyzer(
          this.rootPath,
          documentUri,
          this.logger
        );
      }

      this.logger.info("File indexing starting");
      // We will initialize all DocumentAnalizers first, because when we analyze documents we enter to their imports and
      // if they are not analyzed we analyze them, in order to be able to analyze imports we need to have DocumentAnalizer and
      // therefore we initiate everything first. The isAnalyzed serves to check if the document was analyzed so we don't analyze the document twice.
      for (let i = 0; i < documentsUri.length; i++) {
        const documentUri = documentsUri[i];

        try {
          const documentAnalyzer = this.getDocumentAnalyzer(documentUri);
          // if (documentAnalyzer.uri.includes("node_modules")) {
          //     continue;
          // }

          const data: IndexFileData = {
            path: documentUri,
            current: i + 1,
            total: documentsUri.length,
          };

          em.emit("indexing-file", data);
          this.logger.trace("Indexing file", data);

          if (!documentAnalyzer.isAnalyzed) {
            documentAnalyzer.analyze(this.documentsAnalyzer);
          }
        } catch (err) {
          this.logger.error(err);
          this.logger.trace("Analysis of file failed", { documentUri });
        }
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
      documentAnalyzer = new DocumentAnalyzer(this.rootPath, uri, this.logger);
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

  private findSolFiles(base: string | undefined, documentsUri: string[]): void {
    if (!base) {
      return;
    }

    try {
      if (!fs.existsSync(base)) {
        this.logger.trace("Sol file scan could not find directory", {
          directory: base,
        });

        return;
      }

      const files = fs.readdirSync(base);

      files.forEach((file) => {
        const newBase = path.join(base || "", file);

        if (fs.statSync(newBase).isDirectory()) {
          this.findSolFiles(newBase, documentsUri);
        } else if (
          newBase.slice(-4) === ".sol" &&
          newBase.split("node_modules").length < 3 &&
          !documentsUri.includes(newBase)
        ) {
          documentsUri.push(newBase);
        }
      });
    } catch (err) {
      this.logger.error(err);
    }
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

      this.ast = parser.parse(this.document || "", {
        loc: true,
        range: true,
        tolerant: true,
      });

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
