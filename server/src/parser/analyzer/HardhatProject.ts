import { ISolProject } from "@common/types";
import { WorkspaceFolder } from "vscode-languageserver-protocol";

export class HardhatProject implements ISolProject {
  type: "hardhat" = "hardhat";
  basePath: string;
  configPath: string;
  workspaceFolder: WorkspaceFolder;

  constructor(
    basePath: string,
    configPath: string,
    workspaceFolder: WorkspaceFolder
  ) {
    this.basePath = basePath;
    this.configPath = configPath;
    this.workspaceFolder = workspaceFolder;
  }
}
