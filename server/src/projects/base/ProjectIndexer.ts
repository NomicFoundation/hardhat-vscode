import { WorkspaceFolder } from "vscode-languageserver-protocol";
import { ServerState } from "../../types";
import Project from "./Project";

export default abstract class ProjectIndexer {
  constructor(public serverState: ServerState) {}

  public abstract index(folder: WorkspaceFolder): Project[];
}
