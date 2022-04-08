import { Searcher } from "@analyzer/searcher";
import {
  Node,
  ISolFileEntry as ISolFileEntry,
  ASTNode,
  EmptyNode,
  Searcher as ISearcher,
  SolFileState,
  ISolProject,
} from "@common/types";

export class SolFileEntry implements ISolFileEntry {
  uri: string;
  project: ISolProject;
  document: string | undefined;
  status: SolFileState;

  ast: ASTNode | undefined;
  analyzerTree: { tree: Node };
  searcher: ISearcher;
  orphanNodes: Node[] = [];

  private constructor(uri: string, project: ISolProject) {
    this.uri = uri;
    this.project = project;
    this.document = "";
    this.status = SolFileState.Unloaded;

    this.analyzerTree = {
      tree: new EmptyNode(
        { type: "Empty" },
        this.uri,
        this.project.basePath,
        {}
      ),
    };

    this.searcher = new Searcher(this.analyzerTree);
  }

  static createUnloadedEntry(uri: string, project: ISolProject) {
    return new SolFileEntry(uri, project);
  }

  static createLoadedEntry(uri: string, project: ISolProject, text: string) {
    const unloaded = new SolFileEntry(uri, project);

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
