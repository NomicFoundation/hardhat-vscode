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
  public uri: string;
  public project: ISolProject;
  public document: string | undefined;
  public status: SolFileState;

  public ast: ASTNode | undefined;
  public analyzerTree: { tree: Node };
  public searcher: ISearcher;
  public orphanNodes: Node[] = [];

  private constructor(uri: string, project: ISolProject) {
    this.uri = uri;
    this.project = project;
    this.document = "";
    this.status = SolFileState.UNLOADED;

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

  public static createUnloadedEntry(uri: string, project: ISolProject) {
    return new SolFileEntry(uri, project);
  }

  public static createLoadedEntry(
    uri: string,
    project: ISolProject,
    text: string
  ) {
    const unloaded = new SolFileEntry(uri, project);

    return unloaded.loadText(text);
  }

  public loadText(text: string): ISolFileEntry {
    this.status = SolFileState.DIRTY;
    this.document = text;

    return this;
  }

  public isAnalyzed(): boolean {
    return this.status === SolFileState.ANALYZED;
  }
}
