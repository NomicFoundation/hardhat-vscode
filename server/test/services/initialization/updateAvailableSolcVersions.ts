import { assert } from "chai";
import * as net from "net";
import semver from "semver";
import * as sinon from "sinon";
import {
  availableVersions,
  fetchLatestVersions,
  releasedVersionsFrom,
} from "@services/initialization/updateAvailableSolcVersions";
import { ServerState } from "../../../src/types";
import { setupMockTelemetry } from "../../helpers/setupMockTelemetry";

describe("update available solc versions", () => {
  describe("bundled version list", () => {
    it("should be a sorted list of valid, unique versions", () => {
      for (const version of availableVersions) {
        assert.strictEqual(semver.valid(version), version);
      }

      assert.deepStrictEqual(availableVersions, [
        ...new Set(availableVersions),
      ]);
      assert.deepStrictEqual(
        availableVersions,
        [...availableVersions].sort(semver.compare)
      );
    });
  });

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

    it("should discard entries that aren't valid versions", () => {
      const versions = releasedVersionsFrom({
        builds: [{ version: "0.8.30" }, { version: "not-a-version" }, {}],
      });

      assert.deepStrictEqual(versions, ["0.8.30"]);
    });

    it("should tolerate a malformed payload", () => {
      assert.deepStrictEqual(releasedVersionsFrom({}), []);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      assert.deepStrictEqual(releasedVersionsFrom({ builds: "x" } as any), []);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      assert.deepStrictEqual(releasedVersionsFrom({ releases: [] } as any), []);
    });
  });

  describe("fetchLatestVersions", () => {
    let server: net.Server;
    let connections: number;
    let escapedErrors: unknown[];
    const recordEscapedError = (error: unknown) => escapedErrors.push(error);

    beforeEach(async () => {
      connections = 0;
      escapedErrors = [];
      process.on("unhandledRejection", recordEscapedError);
      process.on("uncaughtException", recordEscapedError);

      // Reset every connection before a response, the way a flaky network
      // does.
      server = net.createServer((socket) => {
        connections++;
        socket.resetAndDestroy();
      });

      await new Promise<void>((resolve) =>
        server.listen(0, "127.0.0.1", resolve)
      );
    });

    afterEach(async () => {
      process.off("unhandledRejection", recordEscapedError);
      process.off("uncaughtException", recordEscapedError);

      await new Promise((resolve) => server.close(resolve));
    });

    it("should fall back to no versions, without retrying, when the request fails", async () => {
      const telemetry = setupMockTelemetry();
      const state = { telemetry } as unknown as ServerState;
      const { port } = server.address() as net.AddressInfo;

      const versions = await fetchLatestVersions(
        state,
        `http://127.0.0.1:${port}/wasm/list.json`
      );

      assert.deepStrictEqual(versions, []);
      assert.isTrue((telemetry.captureException as sinon.SinonSpy).calledOnce);

      // Outlast got's first retry delay (about a second). On Node 24.20 a
      // retry can fire after the request has already rejected, which throws
      // from got's `onCancel` and leaves an orphaned request whose own error
      // is uncaught, taking the language server down.
      await new Promise((resolve) => setTimeout(resolve, 1500));

      assert.strictEqual(connections, 1);
      assert.deepStrictEqual(escapedErrors, []);
    });
  });
});
