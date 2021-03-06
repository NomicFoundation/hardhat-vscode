import { ISolProject } from "@common/types";
import { WorkspaceFolder } from "vscode-languageserver-protocol";

export function isHardhatProject(
  project: ISolProject
): project is HardhatProject {
  return project.type === "hardhat";
}

export class HardhatProject implements ISolProject {
  public type: "hardhat" = "hardhat";
  public basePath: string;
  public configPath: string;
  public workspaceFolder: WorkspaceFolder;

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
