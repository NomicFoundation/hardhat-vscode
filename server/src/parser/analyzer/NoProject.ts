import { ISolProject, SolProjectType } from "@common/types";
import { WorkspaceFolder } from "vscode-languageserver-protocol";

export function isNoProject(project: ISolProject): project is NoProject {
  return project.type === "none";
}

export class NoProject implements ISolProject {
  public type: SolProjectType = "none";
  public basePath: string;
  public configPath: string;
  public workspaceFolder: WorkspaceFolder;

  constructor() {
    this.basePath = "";
    this.configPath = "";
    this.workspaceFolder = {
      name: "none",
      uri: "",
    };
  }
}
