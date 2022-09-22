/* eslint-disable @typescript-eslint/no-explicit-any */

import { existsSync } from "fs";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import path from "path";
import CompilationDetails from "../../projects/base/CompilationDetails";

export default class CompilationService {
  public static async compile(
    compilationDetails: CompilationDetails
  ): Promise<any> {
    const hre = this._getHRE();

    // Find or download solc compiler
    const { compilerPath } = await hre.run("compile:solidity:solc:get-build", {
      solcVersion: compilationDetails.solcVersion,
      quiet: true,
    });

    // Compile
    return hre.run("compile:solidity:solc:run", {
      input: compilationDetails.input,
      solcPath: compilerPath,
    });
  }

  // Workaround to load hardhat, since it requires a hardhat.config file to exist
  private static _getHRE(): HardhatRuntimeEnvironment {
    let directory = __dirname;
    while (directory !== "/") {
      const potentialConfigFiles = ["ts", "js"].map((ext) =>
        path.join(directory, `hardhat.config.${ext}`)
      );
      for (const potentialConfigFile of potentialConfigFiles) {
        if (existsSync(potentialConfigFile)) {
          process.env.HARDHAT_CONFIG = potentialConfigFile;
          return require("hardhat");
        }
      }
      directory = path.dirname(directory);
    }
    throw new Error(`Couldn't load bundled hardhat library`);
  }
}
