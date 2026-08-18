import { assert } from "chai";
import { buildNoVersionError } from "../../../src/frameworks/shared/buildBasicCompilation";

describe("no available solc version error", () => {
  it("should deduplicate the pragmas", () => {
    const message = buildNoVersionError(
      ["^0.8.20", "^0.8.20", "^0.8.20"],
      ["0.7.0"]
    );

    assert.include(message, "satisfying ^0.8.20.");
  });

  it("should join the pragmas with spaces, so the requirement is a valid semver range", () => {
    const message = buildNoVersionError(["^0.8.20", ">=0.7.0"], ["0.6.0"]);

    assert.include(message, "^0.8.20 >=0.7.0");
    assert.notInclude(message, ",");
  });

  it("should report the available range, which is the usual cause", () => {
    const message = buildNoVersionError(
      ["^0.8.20"],
      ["0.3.6", "0.7.0", "0.8.16"]
    );

    assert.include(message, "Available versions: 0.3.6 - 0.8.16");
  });

  it("should report only the bounds, not every available version", () => {
    const message = buildNoVersionError(
      ["^0.8.20"],
      ["0.3.6", "0.7.0", "0.8.16"]
    );

    assert.notInclude(message, "0.7.0");
  });

  it("should report real bounds even when the available list is not sorted", () => {
    const message = buildNoVersionError(
      ["^0.9.0"],
      ["0.8.16", "0.3.6", "0.8.36"]
    );

    assert.include(message, "Available versions: 0.3.6 - 0.8.36");
  });

  it("should not render a range for a single available version", () => {
    const message = buildNoVersionError(["^0.8.20"], ["0.7.0"]);

    assert.include(message, "Available versions: 0.7.0");
    assert.notInclude(message, "-");
  });

  it("should handle an empty available list", () => {
    const message = buildNoVersionError(["^0.8.20"], []);

    assert.include(message, "Available versions: none");
  });

  it("should ignore entries that aren't valid versions rather than throwing", () => {
    const message = buildNoVersionError(
      ["^0.9.0"],
      ["not-a-version", "0.7.0", "0.8.36"]
    );

    assert.include(message, "Available versions: 0.7.0 - 0.8.36");
  });
});
