/* eslint-disable @typescript-eslint/no-explicit-any */

import { existsSync } from "fs";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import path from "path";
import { CompilationDetails } from "../../frameworks/base/CompilationDetails";

export class CompilationService {
  public static async compile(
    {
      cachedCompilerInfo,
    }: {
      cachedCompilerInfo: {
        [solcVersion: string]: { isSolcJs: boolean; compilerPath: string };
      };
    },
    compilationDetails: CompilationDetails
  ): Promise<any> {
    const hre = this._getHRE();
    const { input, solcVersion } = compilationDetails;

    // Empty outputSelection for faster compilation
    delete (input.settings as any).outputSelection;

    // Find or download solc compiler
    let compilerPath: string;
    let isSolcJs: boolean;

    if (cachedCompilerInfo[solcVersion] !== undefined) {
      compilerPath = cachedCompilerInfo[solcVersion].compilerPath;
      isSolcJs = cachedCompilerInfo[solcVersion].isSolcJs;
    } else {
      const solcBuild = await hre.run("compile:solidity:solc:get-build", {
        solcVersion,
        quiet: true,
      });
      compilerPath = solcBuild.compilerPath;
      isSolcJs = solcBuild.isSolcJs;

      cachedCompilerInfo[solcVersion] = { compilerPath, isSolcJs };
    }

    // Compile
    let output;
    if (isSolcJs) {
      output = await hre.run("compile:solidity:solcjs:run", {
        input,
        solcJsPath: compilerPath,
      });
    } else {
      output = await hre.run("compile:solidity:solc:run", {
        input,
        solcPath: compilerPath,
      });
    }
    // Normalize errors' sourceLocation to use utf-8 offsets instead of byte offsets
    for (const error of output.errors || []) {
      const source = input.sources[error.sourceLocation?.file];

      if (source === undefined) {
        continue;
      }

      error.sourceLocation.start = this._normalizeOffset(
        source.content,
        error.sourceLocation.start
      );
      error.sourceLocation.end = this._normalizeOffset(
        source.content,
        error.sourceLocation.end
      );
    }

    return output;
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

  private static _normalizeOffset(text: string, offset: number) {
    if (offset < 0) {
      return offset; // don't transform negative offsets
    } else {
      return Buffer.from(text, "utf-8").slice(0, offset).toString("utf-8")
        .length;
    }
  }
}
