import { assert } from "chai";
import { buildNoVersionError } from "../../../src/frameworks/shared/buildBasicCompilation";

// The pragmas of a real dependency tree are overwhelmingly duplicates - see
// #711, where the message rendered 64 entries of which only 12 were distinct,
// comma-joined even though the code ANDs them with spaces. That output was
// unreadable and, worse, not a valid semver range, so it couldn't be pasted
// anywhere to check.
describe("no available solc version error", () => {
  it("should deduplicate the pragmas", () => {
    const message = buildNoVersionError(
      ["^0.8.28", "^0.8.28", ">=0.7.5", "^0.8.28"],
      ["0.8.16"]
    );

    assert.include(message, "^0.8.28 >=0.7.5");
    assert.include(message, "2 distinct pragmas");
    assert.notInclude(message, "^0.8.28 ^0.8.28");
  });

  it("should join with spaces so the requirement is a valid semver range", () => {
    const message = buildNoVersionError(["^0.8.28", ">=0.7.5"], ["0.8.16"]);

    assert.notInclude(message, "^0.8.28,>=0.7.5");
  });

  it("should report the available range, which is the actual cause", () => {
    const message = buildNoVersionError(["^0.8.28"], ["0.3.6", "0.8.16"]);

    assert.include(message, "Available versions: 0.3.6 - 0.8.16");
  });

  it("should report only the bounds, not every available version", () => {
    const message = buildNoVersionError(
      ["^0.9.0"],
      ["0.8.14", "0.8.15", "0.8.16"]
    );

    assert.include(message, "Available versions: 0.8.14 - 0.8.16");
    assert.notInclude(message, "0.8.15");
  });

  it("should report real bounds even if the list is not sorted", () => {
    const message = buildNoVersionError(
      ["^0.9.0"],
      ["0.8.16", "0.3.6", "0.8.4"]
    );

    assert.include(message, "Available versions: 0.3.6 - 0.8.16");
  });

  it("should not render a range for a single available version", () => {
    const message = buildNoVersionError(["^0.9.0"], ["0.8.16"]);

    assert.include(message, "Available versions: 0.8.16");
    assert.notInclude(message, "0.8.16 - 0.8.16");
  });

  it("should use the singular for a single pragma", () => {
    const message = buildNoVersionError(["^0.8.28"], ["0.8.16"]);

    assert.include(message, "1 pragma");
    assert.notInclude(message, "distinct pragmas");
  });

  it("should handle an empty available list", () => {
    const message = buildNoVersionError(["^0.8.28"], []);

    assert.include(message, "Available versions: none");
  });
});
