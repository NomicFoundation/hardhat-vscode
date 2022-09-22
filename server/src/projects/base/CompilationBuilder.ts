import { ServerState } from "../../types";
import CompilationDetails from "./CompilationDetails";
import Project from "./Project";

export default abstract class CompilationBuilder {
  protected serverState: ServerState;

  constructor(protected project: Project) {
    this.serverState = project.serverState;
  }

  public abstract buildCompilation(
    sourceUri: string,
    openDocs: Array<{ uri: string; documentText: string }>
  ): Promise<CompilationDetails>;
}
