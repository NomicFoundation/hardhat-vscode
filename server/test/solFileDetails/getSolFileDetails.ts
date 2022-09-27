import { lowercaseDriveLetter, toUnixStyle } from "@utils/index";
import * as assert from "assert";
import * as path from "path";
import { forceToUnixStyle } from "../helpers/forceToUnixStyle";
import { prependWithSlash } from "../helpers/prependWithSlash";
import {
  OnRequest,
  setupMockLanguageServer,
} from "../helpers/setupMockLanguageServer";
import { runningOnWindows } from "../../src/utils/operatingSystem";

describe("Solidity Language Server", () => {
  describe("get sol file details", () => {
    const workspaceFolder = prependWithSlash(
      forceToUnixStyle(path.join(__dirname, ".."))
    );

    const projectUri = forceToUnixStyle(
      path.join(__dirname, "testData", "project", "hardhat.config.ts")
    );

    const outwithUri = forceToUnixStyle(
      path.join(__dirname, "testData", "outwith.sol")
    );

    const withinUri = forceToUnixStyle(
      path.join(__dirname, "testData", "project", "within.sol")
    );

    let request: OnRequest;

    before(async () => {
      ({
        server: { request },
      } = await setupMockLanguageServer({
        projects: { [workspaceFolder]: [projectUri] },
        documents: [
          { uri: outwithUri, analyze: true },
          { uri: withinUri, analyze: true },
        ],
        errors: [],
      }));
    });

    it("returns the project config file for hardhat files", async () => {
      const response = await request({
        uri: prependWithFilePrefix(withinUri),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      assert.deepStrictEqual(response, {
        found: true,
        hardhat: true,
        configPath: lowercaseDriveLetter(toUnixStyle(projectUri)),
        configDisplayPath: "solFileDetails/testData/project/hardhat.config.ts",
      });
    });

    it("returns no project config for non-hardhat files", async () => {
      const response = await request({
        uri: prependWithFilePrefix(outwithUri),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      assert.deepStrictEqual(response, {
        found: true,
        hardhat: false,
      });
    });

    it("returns not found for unknown files", async () => {
      const response = await request({
        uri: prependWithFilePrefix("nonexistant.sol"),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      assert.deepStrictEqual(response, {
        found: false,
      });
    });
  });
});

function prependWithFilePrefix(filePath: string) {
  return runningOnWindows() ? `file:///${filePath}` : `file://${filePath}`;
}
