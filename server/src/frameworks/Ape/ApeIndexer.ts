import path from "path";
import { WorkspaceFolder } from "vscode-languageserver-protocol";
import { decodeUriAndRemoveFilePrefix } from "../../utils";
import { ProjectIndexer } from "../base/ProjectIndexer";
import { ApeProject } from "./ApeProject";

export class ApeIndexer extends ProjectIndexer {
  public async index(folder: WorkspaceFolder) {
    const uri = decodeUriAndRemoveFilePrefix(folder.uri);
    const configFiles = await this.fileRetriever.findFiles(
      uri,
      "**/ape-config.yaml",
      ["**/.cache/**"]
    );

    return configFiles.map((configFile) => {
      const basePath = path.dirname(configFile);

      return new ApeProject(this.serverState, basePath, configFile);
    });
  }
}
