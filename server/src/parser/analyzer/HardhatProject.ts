import { ISolProject, Remapping } from "@common/types";
import { WorkspaceFolder } from "vscode-languageserver-protocol";

export function isHardhatProject(
  project: ISolProject
): project is HardhatProject {
  return project.type === "hardhat";
}

export class HardhatProject implements ISolProject {
  public type: "hardhat" = "hardhat";

  constructor(
    public basePath: string,
    public configPath: string,
    public workspaceFolder: WorkspaceFolder,
    public remappings: Remapping[] = []
  ) {}
}
