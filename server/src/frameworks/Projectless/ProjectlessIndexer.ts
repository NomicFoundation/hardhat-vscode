import { WorkspaceFolder } from "vscode-languageserver-protocol";
import { ProjectIndexer } from "../base/ProjectIndexer";
import { ProjectlessProject } from "./ProjectlessProject";

export class ProjectlessIndexer extends ProjectIndexer {
  public async index(folder: WorkspaceFolder) {
    return [new ProjectlessProject(this.serverState, folder.uri)];
  }
}
