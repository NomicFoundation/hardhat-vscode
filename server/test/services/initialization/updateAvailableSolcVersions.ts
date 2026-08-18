import { assert } from "chai";
import semver from "semver";
import { availableVersions } from "@services/initialization/updateAvailableSolcVersions";

describe("update available solc versions", () => {
  describe("bundled version list", () => {
    it("should be a sorted list of valid, unique versions", () => {
      for (const version of availableVersions) {
        assert.strictEqual(semver.valid(version), version);
      }

      assert.deepStrictEqual(availableVersions, [...new Set(availableVersions)]);
      assert.deepStrictEqual(
        availableVersions,
        [...availableVersions].sort(semver.compare)
      );
    });
  });
});
