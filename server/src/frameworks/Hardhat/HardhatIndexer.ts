import path from "path";
import { WorkspaceFolder } from "vscode-languageserver-protocol";
import { decodeUriAndRemoveFilePrefix } from "../../utils";
import { ProjectIndexer } from "../base/ProjectIndexer";
import { HardhatProject } from "./HardhatProject";

export class HardhatIndexer extends ProjectIndexer {
  public async index(folder: WorkspaceFolder) {
    const uri = decodeUriAndRemoveFilePrefix(folder.uri);
    const configFiles = await this.fileRetriever.findFiles(
      uri,
      "**/hardhat.config.{ts,js}",
      ["**/node_modules/**"]
    );

    return configFiles.map(
      (configFile) =>
        new HardhatProject(
          this.serverState,
          path.dirname(configFile),
          configFile
        )
    );
  }
}
