import { WorkspaceFolder } from "vscode-languageserver-protocol";
import { ISolProject, SolProjectType } from "../../parser/common/types";
import { ServerState } from "../../types";
import CompilationBuilder from "./CompilationBuilder";

export default abstract class Project implements ISolProject {
  public abstract builder: CompilationBuilder;

  constructor(public serverState: ServerState, public basePath: string) {}

  // These are in place just to implement ISolProject. That interface should be removed
  // and this class should be the base abstraction for projects
  public abstract type: SolProjectType;
  public abstract configPath: string;
  public abstract workspaceFolder: WorkspaceFolder;
  public remappings = [];

  public abstract fileBelongs(file: string): boolean;

  public abstract resolveImportPath(
    file: string,
    importPath: string
  ): string | undefined;
}
