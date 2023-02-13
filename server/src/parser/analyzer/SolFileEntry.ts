import { Searcher } from "@analyzer/searcher";
import {
  Node,
  ISolFileEntry as ISolFileEntry,
  ASTNode,
  EmptyNode,
  Searcher as ISearcher,
  SolFileState,
} from "@common/types";
import { Project } from "../../frameworks/base/Project";

export class SolFileEntry implements ISolFileEntry {
  public uri: string;
  public project: Project;
  public text: string | undefined;
  public status: SolFileState;

  public ast: ASTNode | undefined;
  public analyzerTree: { tree: Node };
  public searcher: ISearcher;
  public orphanNodes: Node[] = [];
  public isLocal: boolean;

  private constructor(uri: string, project: Project) {
    this.uri = uri;
    this.project = project;
    this.text = "";
    this.status = SolFileState.UNLOADED;
    this.isLocal = true;

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

  public static createUnloadedEntry(uri: string, project: Project) {
    return new SolFileEntry(uri, project);
  }

  public static createLoadedEntry(
    uri: string,
    project: Project,
    text: string,
    isLocal: boolean
  ): ISolFileEntry {
    const unloaded = new SolFileEntry(uri, project);
    unloaded.isLocal = isLocal;

    return unloaded.loadText(text);
  }

  public loadText(text: string) {
    this.status = SolFileState.LOADED;
    this.text = text;

    return this;
  }

  public isAnalyzed(): boolean {
    return this.status === SolFileState.ANALYZED;
  }
}
