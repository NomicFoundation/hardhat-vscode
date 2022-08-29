/* eslint-disable @typescript-eslint/no-unused-vars */
import path from "path";
import * as vscode from "vscode";
import { getHardhatCLIPath } from "../../../../client/src/utils/hardhat";
import { getCurrentOpenFile } from "../../../../client/src/utils/workspace";
import { checkOrWaitDiagnostic } from "../../helpers/assertions";
import { getDocPath, getDocUri } from "../../helpers/docPaths";
import {
  applyQuickfix,
  compareWithFile,
  goToPosition,
  openFileInEditor,
  openQuickfixMenu,
} from "../../helpers/editor";
import { sleep } from "../../helpers/sleep";

suite("commands - compile", function () {
  this.timeout(20000);

  test("compile project", async () => {
    // const uri = getDocUri(__dirname, "./Compile.sol");
    // const editor = await openFileInEditor(uri);
    // const thePath = path.join(
    //   __dirname,
    //   "..",
    //   "..",
    //   "..",
    //   "..",
    //   "..",
    //   "test",
    //   "integration"
    // );
    // const hre = getHRE(thePath);
    // const cli = getHardhatCLIPath(thePath);
    // await sleep(3000);
    // console.log(hre.config.paths.sources);
    // hre.config.paths.sources = path.join(thePath, "tests", "commands");
    // console.log(hre.config.paths.sources);
    // console.log(cli);
    // clearTestContracts();
    // console.log(getDocPath(__dirname, "/"));
    // await setFolderWithContractsToBeCompiled(getDocPath(__dirname, "/"));
    // await sleep(3000);
    // await hre.run("compile");
    // await vscode.commands.executeCommand("hardhat.solidity.compile");
  });
});

function getHRE(configPath: string): any {
  try {
    console.log(configPath);
    process.chdir(configPath);

    const registerPath = require.resolve(`hardhat/register.js`, {
      paths: [configPath],
    });
    require(registerPath);

    const hrePath = require.resolve(`hardhat/internal/lib/hardhat-lib`, {
      paths: [configPath],
    });

    return require(hrePath);
  } catch (e) {
    throw new Error("Hardhat lib not found");
  }
}
