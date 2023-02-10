import path from "path";
import { WorkspaceFolder } from "vscode-languageserver-protocol";
import { decodeUriAndRemoveFilePrefix } from "../../utils";
import { ProjectIndexer } from "../base/ProjectIndexer";
import { TruffleProject } from "./TruffleProject";

export class TruffleIndexer extends ProjectIndexer {
  public async index(folder: WorkspaceFolder) {
    const uri = decodeUriAndRemoveFilePrefix(folder.uri);
    const configFiles = await this.fileRetriever.findFiles(
      uri,
      "**/{truffle-config,truffle}.js",
      ["**/node_modules/**"]
    );

    return configFiles.map((configFile) => {
      const basePath = path.dirname(configFile);

      return new TruffleProject(this.serverState, basePath, configFile);
    });
  }
}
