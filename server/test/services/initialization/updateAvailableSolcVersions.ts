import { assert } from "chai";
import semver from "semver";
import {
  availableVersions,
  releasedVersionsFrom,
} from "@services/initialization/updateAvailableSolcVersions";

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
});
