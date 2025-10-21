import path from "path";
import { WorkspaceFolder } from "vscode-languageserver-protocol";
import semver from "semver";
import { readFileSync } from "fs";
import { decodeUriAndRemoveFilePrefix } from "../../utils";
import { ProjectIndexer } from "../base/ProjectIndexer";
import { findClosestPackageJson } from "../../utils/npm";
import { Project } from "../base/Project";
import { Hardhat3Project } from "./Hardhat3/Hardhat3Project";
import { Hardhat2Project } from "./Hardhat2/Hardhat2Project";

export class HardhatIndexer extends ProjectIndexer {
  public async index(folder: WorkspaceFolder) {
    const uri = decodeUriAndRemoveFilePrefix(folder.uri);

    // Find all hardhat.config files in the workspace folder
    const configFiles = await this.fileRetriever.findFiles(
      uri,
      "**/hardhat.config.{ts,cts,js,cjs}",
      ["**/node_modules/**"]
    );

    const hardhatProjects: Project[] = [];

    // Create instances of either hardhat 2 or hardhat 3 projects
    for (const configFile of configFiles) {
      try {
        // Find the project's package.json
        const packageJsonPath = await findClosestPackageJson(
          this.fileRetriever,
          path.dirname(configFile)
        );

        // No package.json found -> error fallback
        if (packageJsonPath === undefined) {
          throw new Error(`No package.json found`);
        }

        // Read the project's package.json
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const projectPackage = JSON.parse(
          readFileSync(packageJsonPath, "utf8")
        );

        // Get the hardhat's version range
        const hardhatVersionRange = [
          (projectPackage.dependencies || {}).hardhat,
          (projectPackage.devDependencies || {}).hardhat,
          (projectPackage.peerDependencies || {}).hardhat,
        ].filter(Boolean)[0];

        if (
          hardhatVersionRange !== undefined &&
          semver.subset(hardhatVersionRange, ">=3.0.0-next.0 || >= 3.0.0", {
            includePrerelease: true,
          })
        ) {
          // Hardhat 3 version detected
          hardhatProjects.push(
            this._buildHardhat3Project(configFile, packageJsonPath)
          );
        } else {
          // Hardhat 2 version detected
          hardhatProjects.push(this._buildHardhat2Project(configFile));
        }
      } catch (error) {
        // Fallback on error -> default to hardhat 2
        this.serverState.logger.info(
          `Error indexing hardhat 3 project (${configFile}): ${error}`
        );
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
