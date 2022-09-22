import fs from "fs";
import path from "path";
import { WorkspaceFolder } from "vscode-languageserver-protocol";
import { SolProjectType } from "../../parser/common/types";
import { ServerState } from "../../types";
import { toUnixStyle } from "../../utils";
import Project from "../base/Project";
import ProjectlessCompilationBuilder from "./ProjectlessCompilationBuilder";

export default class ProjectlessProject extends Project {
  // These are in place just to implement ISolProject. Should be removed after refactor
  public type: SolProjectType = "none";
  public configPath = "";
  public basePath = "";
  public workspaceFolder: WorkspaceFolder = {
    name: "none",
    uri: "",
  };

  public builder: ProjectlessCompilationBuilder;

  constructor(serverState: ServerState, basePath: string) {
    super(serverState, basePath);
    this.builder = new ProjectlessCompilationBuilder(this);
  }

  public fileBelongs(_file: string): boolean {
    return true;
  }

  public resolveImportPath(file: string, importPath: string) {
    try {
      const resolvedPath = require.resolve(importPath, {
        paths: [fs.realpathSync(path.dirname(file))],
      });

      return toUnixStyle(fs.realpathSync(resolvedPath));
    } catch (error) {
      return undefined;
    }
  }
}
