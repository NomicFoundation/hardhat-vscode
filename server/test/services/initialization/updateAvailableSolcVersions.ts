import { assert } from "chai";
import fs from "fs/promises";
import got from "got";
import os from "os";
import path from "path";
import * as sinon from "sinon";
import {
  availableVersions,
  loadKnownSolcVersions,
  refreshSolcVersions,
  releasedVersionsFrom,
} from "@services/initialization/updateAvailableSolcVersions";
import { readRememberedVersions } from "@services/initialization/solcVersionsCache";
import { ServerState } from "../../../src/types";
import { setupMockLogger } from "../../helpers/setupMockLogger";
import { setupMockTelemetry } from "../../helpers/setupMockTelemetry";

const NEWEST_BUNDLED = availableVersions[availableVersions.length - 1];

// A version the bundled list does not contain. The whole point of remembering
// and fetching is to learn about releases newer than the bundle, so asserting
// on a version that is already bundled would pass without exercising anything.
const FUTURE_VERSION = "0.9.99";

describe("update available solc versions", () => {
  let storageDir: string;
  let state: ServerState;

  it("guards the fixture: the future version must not be bundled", () => {
    // If the bundled list ever grows past this, the tests below would start
    // passing for the wrong reason.
    assert.notInclude(availableVersions, FUTURE_VERSION);
  });

  beforeEach(async () => {
    storageDir = await fs.mkdtemp(path.join(os.tmpdir(), "solc-versions-"));

    state = {
      logger: setupMockLogger(),
      telemetry: setupMockTelemetry(),
      solcVersions: availableVersions,
      globalStoragePath: storageDir,
    } as unknown as ServerState;
  });

  afterEach(async () => {
    sinon.restore();
    await fs.rm(storageDir, { recursive: true, force: true });
  });

  describe("loadKnownSolcVersions", () => {
    it("should include versions remembered from an earlier session", async () => {
      await fs.writeFile(
        path.join(storageDir, "solc-versions.json"),
        JSON.stringify({ versions: [FUTURE_VERSION] }),
        "utf8"
      );

      await loadKnownSolcVersions(state);

      // This is the regression: whatever the bundled list ends at, a project
      // requiring something newer could not be validated at all once the
      // network fetch failed.
      assert.include(state.solcVersions, FUTURE_VERSION);
      assert.include(state.solcVersions, NEWEST_BUNDLED);
    });
  });

  // A pre-release build carries the version it is a pre-release *of*, so
  // solc-bin lists 0.8.31-pre.1 as `{version: "0.8.31", prerelease: "pre.1"}`
  // before 0.8.31 exists. Offering that version makes hardhat resolve the
  // pre-release binary, whose diagnostics carry no sourceLocation.
  describe("releasedVersionsFrom", () => {
    it("should prefer the releases map", () => {
      const versions = releasedVersionsFrom({
        builds: [{ version: "0.8.31", prerelease: "pre.1" }],
        // eslint-disable-next-line @typescript-eslint/naming-convention
        releases: { "0.8.30": "soljson-v0.8.30.js" },
      });

      assert.deepStrictEqual(versions, ["0.8.30"]);
    });

    it("should exclude pre-release builds when falling back to builds", () => {
      const versions = releasedVersionsFrom({
        builds: [
          { version: "0.8.30" },
          { version: "0.8.31", prerelease: "pre.1" },
        ],
      });

      assert.deepStrictEqual(versions, ["0.8.30"]);
    });

    it("should treat null and empty prerelease fields as pre-release-free", () => {
      const versions = releasedVersionsFrom({
        builds: [
          { version: "0.8.29", prerelease: null },
          { version: "0.8.30", prerelease: "" },
        ],
      });

      assert.deepStrictEqual(versions, ["0.8.29", "0.8.30"]);
    });

    it("should tolerate a malformed payload", () => {
      assert.deepStrictEqual(releasedVersionsFrom({}), []);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      assert.deepStrictEqual(releasedVersionsFrom({ builds: "x" } as any), []);
    });
  });

  describe("refreshSolcVersions", () => {
    function stubFetch(released: string[], prereleaseOnly: string[] = []) {
      return sinon.stub(got, "get").returns({
        json: async () => ({
          builds: [
            ...released.map((version) => ({ version })),
            ...prereleaseOnly.map((version) => ({
              version,
              prerelease: "pre.1",
            })),
          ],
          releases: Object.fromEntries(
            released.map((version) => [version, `soljson-v${version}.js`])
          ),
        }),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);
    }

    it("should not offer or persist a version that is only a pre-release", async () => {
      stubFetch([], [FUTURE_VERSION]);

      await refreshSolcVersions(state);

      assert.notInclude(state.solcVersions, FUTURE_VERSION);
      assert.notInclude(
        await readRememberedVersions(storageDir, state.logger),
        FUTURE_VERSION,
        "an unreleased version must not be remembered across restarts"
      );
    });

    it("should union fetched versions into the known set", async () => {
      stubFetch([FUTURE_VERSION]);

      await refreshSolcVersions(state);

      assert.include(state.solcVersions, FUTURE_VERSION);
      assert.include(state.solcVersions, NEWEST_BUNDLED);
    });

    it("should persist what it fetched", async () => {
      stubFetch([FUTURE_VERSION]);

      await refreshSolcVersions(state);

      const remembered = await readRememberedVersions(storageDir, state.logger);

      assert.include(remembered, FUTURE_VERSION);
    });

    it("should keep the known set when the fetch fails", async () => {
      sinon.stub(got, "get").throws(new Error("ENOTFOUND"));

      await refreshSolcVersions(state);

      assert.includeMembers(state.solcVersions, availableVersions);
    });

    it("should not persist anything when the fetch fails", async () => {
      sinon.stub(got, "get").throws(new Error("ENOTFOUND"));

      await refreshSolcVersions(state);

      assert.deepStrictEqual(
        await readRememberedVersions(storageDir, state.logger),
        []
      );
    });

    it("should not lose previously remembered versions on a later failure", async () => {
      stubFetch([FUTURE_VERSION]);
      await refreshSolcVersions(state);
      sinon.restore();

      // A second session that can't reach the network.
      const offlineState = {
        logger: setupMockLogger(),
        telemetry: setupMockTelemetry(),
        solcVersions: availableVersions,
        globalStoragePath: storageDir,
      } as unknown as ServerState;

      await loadKnownSolcVersions(offlineState);

      assert.include(
        offlineState.solcVersions,
        FUTURE_VERSION,
        "a failed fetch must not undo what we already learned"
      );
    });
  });
});
