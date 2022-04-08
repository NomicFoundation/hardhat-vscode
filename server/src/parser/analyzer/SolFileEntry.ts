import * as fs from "fs";
import { Searcher } from "@analyzer/searcher";
import {
  Node,
  ISolFileEntry as ISolFileEntry,
  ASTNode,
  EmptyNode,
  Searcher as ISearcher,
} from "@common/types";

export class SolFileEntry implements ISolFileEntry {
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
