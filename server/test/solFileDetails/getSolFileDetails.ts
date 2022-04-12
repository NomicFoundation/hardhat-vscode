import * as assert from "assert";
import * as path from "path";
import { forceToUnixStyle } from "../helpers/forceToUnixStyle";
import {
  OnRequest,
  setupMockLanguageServer,
} from "../helpers/setupMockLanguageServer";

describe("Solidity Language Server", () => {
  describe("get sol file details", () => {
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
        projects: [projectUri],
        documents: [
          { uri: outwithUri, analyze: true },
          { uri: withinUri, analyze: true },
        ],
        errors: [],
      }));
    });

    it("returns the project config file for hardhat files", async () => {
      const response = await request({
        uri: { path: withinUri },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      assert.deepStrictEqual(response, {
        found: true,
        hardhat: true,
        configPath: projectUri,
        configDisplayPath: "solFileDetails/testData/project/hardhat.config.ts",
      });
    });

    it("returns no project config for non-hardhat files", async () => {
      const response = await request({
        uri: { path: outwithUri },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      assert.deepStrictEqual(response, {
        found: true,
        hardhat: false,
      });
    });

    it("returns not found for unknown files", async () => {
      const response = await request({
        uri: { path: "nonexistant.sol" },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      assert.deepStrictEqual(response, {
        found: false,
      });
    });
  });
});
