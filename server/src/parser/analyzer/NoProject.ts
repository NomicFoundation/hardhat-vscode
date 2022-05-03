import { ISolProject, SolProjectType } from "@common/types";
import { WorkspaceFolder } from "vscode-languageserver-protocol";

export class NoProject implements ISolProject {
  type: SolProjectType = "none";
  basePath: string;
  configPath: string;
  workspaceFolder: WorkspaceFolder;

  constructor() {
    this.basePath = "";
    this.configPath = "";
    this.workspaceFolder = {
      name: "none",
      uri: "",
    };
  }
}
