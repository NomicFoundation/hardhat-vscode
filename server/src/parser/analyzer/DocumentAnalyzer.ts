import * as fs from "fs";
import * as parser from "@solidity-parser/parser";
import * as matcher from "@analyzer/matcher";
import { Searcher } from "@analyzer/searcher";
import {
  Node,
  SourceUnitNode,
  DocumentsAnalyzerMap,
  DocumentAnalyzer as IDocumentAnalyzer,
  ASTNode,
  EmptyNode,
  Searcher as ISearcher,
} from "@common/types";

export class DocumentAnalyzer implements IDocumentAnalyzer {
  // private logger: Logger;
  rootPath: string;

  document: string | undefined;
  uri: string;

  ast: ASTNode | undefined;

  analyzerTree: { tree: Node };
  isAnalyzed = false;

  searcher: ISearcher;

  orphanNodes: Node[] = [];

  constructor(rootPath: string, uri: string) {
    this.rootPath = rootPath;
    this.uri = uri;

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
    } catch {
      return this.analyzerTree.tree;
    }
  }
}
