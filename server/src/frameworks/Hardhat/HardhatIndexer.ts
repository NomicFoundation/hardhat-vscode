import path from "path";
import { WorkspaceFolder } from "vscode-languageserver-protocol";
import semver from "semver";
import { decodeUriAndRemoveFilePrefix } from "../../utils";
import { ProjectIndexer } from "../base/ProjectIndexer";
import { findClosestPackageJson } from "../../utils/npm";
import { Project } from "../base/Project";
import { Hardhat3Project } from "./Hardhat3/Hardhat3Project";
import { Hardhat2Project } from "./Hardhat2/Hardhat2Project";

export class HardhatIndexer extends ProjectIndexer {
  public async index(folder: WorkspaceFolder) {
    const { readPackage } = await import("read-pkg");

    const uri = decodeUriAndRemoveFilePrefix(folder.uri);
    const configFiles = await this.fileRetriever.findFiles(
      uri,
      "**/hardhat.config.{ts,js}",
      ["**/node_modules/**"]
    );

    const hardhatProjects: Project[] = [];

    for (const configFile of configFiles) {
      const packageJsonPath = await findClosestPackageJson(
        this.fileRetriever,
        path.dirname(configFile)
      );

      if (packageJsonPath === undefined) {
        // No package.json -> default to hardhat 2 (keep existing behavior)
        hardhatProjects.push(this._buildHardhat2Project(configFile));
        continue;
      }

      const pkg = await readPackage({ cwd: path.dirname(packageJsonPath) });

      const hardhatVersionRange = [
        (pkg.dependencies || {}).hardhat,
        (pkg.devDependencies || {}).hardhat,
        (pkg.peerDependencies || {}).hardhat,
      ].filter(Boolean)[0];

      if (
        hardhatVersionRange !== undefined &&
        semver.subset(hardhatVersionRange, ">=3.0.0-next.0 || >= 3.0.0", {
          includePrerelease: true,
        })
      ) {
        hardhatProjects.push(
          this._buildHardhat3Project(configFile, packageJsonPath)
        );
      } else {
        hardhatProjects.push(this._buildHardhat2Project(configFile));
      }
    }

    return hardhatProjects;
  }

  private _buildHardhat2Project(configPath: string) {
    return new Hardhat2Project(
      this.serverState,
      path.dirname(configPath),
      configPath
    );
  }

  private _buildHardhat3Project(configPath: string, packageJsonPath: string) {
    return new Hardhat3Project(
      this.serverState,
      path.dirname(packageJsonPath),
      configPath
    );
  }
}
