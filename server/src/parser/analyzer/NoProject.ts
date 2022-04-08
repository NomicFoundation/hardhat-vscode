import { ISolProject, SolProjectType } from "@common/types";
import { WorkspaceFolder } from "vscode-languageserver-protocol";

export class NoProject implements ISolProject {
  basePath: string;
  type: SolProjectType = "none";
  workspaceFolder: WorkspaceFolder;

  constructor() {
    this.basePath = "";
    this.workspaceFolder = {
      name: "none",
      uri: "",
    };
  }
}
