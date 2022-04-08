import { ISolProject } from "@common/types";
import { WorkspaceFolder } from "vscode-languageserver-protocol";

export class HardhatProject implements ISolProject {
  basePath: string;
  type: "hardhat" = "hardhat";
  workspaceFolder: WorkspaceFolder;

  constructor(basePath: string, workspaceFolder: WorkspaceFolder) {
    this.basePath = basePath;
    this.workspaceFolder = workspaceFolder;
  }
}
