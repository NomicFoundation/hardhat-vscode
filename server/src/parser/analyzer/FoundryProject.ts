import { ISolProject, Remapping } from "@common/types";
import { WorkspaceFolder } from "vscode-languageserver-protocol";

export function isFoundryProject(
  project: ISolProject
): project is FoundryProject {
  return project.type === "foundry";
}

export class FoundryProject implements ISolProject {
  public type: "foundry" = "foundry";

  constructor(
    public basePath: string,
    public configPath: string,
    public workspaceFolder: WorkspaceFolder,
    public remappings: Remapping[] = []
  ) {}
}
