import * as fs from "fs";
import { Searcher } from "@analyzer/searcher";
import {
  Node,
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
}
