import { Searcher } from "@analyzer/searcher";
import {
  Node,
  ISolFileEntry as ISolFileEntry,
  ASTNode,
  EmptyNode,
  Searcher as ISearcher,
  SolFileState,
} from "@common/types";

export class SolFileEntry implements ISolFileEntry {
  rootPath: string;
  uri: string;
  document: string | undefined;
  status: SolFileState;

  ast: ASTNode | undefined;
  analyzerTree: { tree: Node };
  searcher: ISearcher;
  orphanNodes: Node[] = [];

  constructor(uri: string, rootPath: string) {
    this.rootPath = rootPath;
    this.uri = uri;
    this.document = "";
    this.status = SolFileState.Unloaded;

    this.analyzerTree = {
      tree: new EmptyNode({ type: "Empty" }, this.uri, this.rootPath, {}),
    };

    this.searcher = new Searcher(this.analyzerTree);
  }

  static createUnloadedEntry(uri: string, rootPath: string) {
    return new SolFileEntry(uri, rootPath);
  }

  static createLoadedEntry(uri: string, rootPath: string, text: string) {
    const unloaded = new SolFileEntry(uri, rootPath);

    return unloaded.loadText(text);
  }

  public loadText(text: string): ISolFileEntry {
    this.status = SolFileState.Dirty;
    this.document = text;

    return this;
  }

  public isAnalyzed(): boolean {
    return this.status === SolFileState.Analyzed;
  }
}
