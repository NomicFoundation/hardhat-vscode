import { WorkspaceFolder } from "vscode-languageserver-protocol";
import Project from "../base/Project";
import ProjectIndexer from "../base/ProjectIndexer";
import ProjectlessProject from "./ProjectlessProject";

export default class ProjectlessIndexer extends ProjectIndexer {
  public index(folder: WorkspaceFolder): Project[] {
    return [new ProjectlessProject(this.serverState, folder.uri)];
  }
}
