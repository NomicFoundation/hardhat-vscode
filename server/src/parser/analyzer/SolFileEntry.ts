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
  uri: string;
  document: string | undefined;
  isAnalyzed: boolean;

  ast: ASTNode | undefined;
  analyzerTree: { tree: Node };
  searcher: ISearcher;
  orphanNodes: Node[] = [];

  constructor(rootPath: string, uri: string, text: string) {
    this.rootPath = rootPath;
    this.uri = uri;
    this.document = text;
    this.isAnalyzed = false;

    this.analyzerTree = {
      tree: new EmptyNode({ type: "Empty" }, this.uri, this.rootPath, {}),
    };

    this.searcher = new Searcher(this.analyzerTree);
  }
}
