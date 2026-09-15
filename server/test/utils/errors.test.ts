import { assert } from "chai";
import { asError } from "../../src/utils/errors";

describe("asError", () => {
  it("passes an Error through untouched", () => {
    const err = new Error("boom");

    assert.strictEqual(asError(err), err);
  });

  it("wraps a plain object, naming its keys", () => {
    // The shape Hardhat 3's dependency graph throws, and the reason the
    // largest issue in the project has no stack.
    const thrown = { absoluteFilePath: "/home/user/a.sol", type: "npm" };

    const err = asError(thrown);

    assert.instanceOf(err, Error);
    assert.strictEqual(
      err.message,
      "Non-Error object thrown with keys: absoluteFilePath, type"
    );
    assert.strictEqual(err.cause, thrown);
  });

  it("names the keys in a stable order", () => {
    assert.strictEqual(
      asError({ b: 1, a: 2 }).message,
      asError({ a: 2, b: 1 }).message
    );
  });

  it("gives the wrapped error a stack, which is the point", () => {
    const err = asError({ type: "npm" });

    assert.isString(err.stack);
    assert.include(err.stack ?? "", "errors.test.ts");
  });

  it("prefers an error descriptor's title", () => {
    const err = asError({
      errorDescriptor: { title: "Invalid config", description: "..." },
    });

    assert.strictEqual(err.message, "Invalid config");
  });

  it("keeps a thrown string as the message", () => {
    assert.strictEqual(
      asError("Error loading config file").message,
      "Error loading config file"
    );
  });

  it("describes a thrown primitive by its type", () => {
    assert.strictEqual(asError(42).message, "Non-Error value thrown: number");
    assert.strictEqual(
      asError(undefined).message,
      "Non-Error value thrown: undefined"
    );
  });

  it("handles an empty object", () => {
    assert.strictEqual(asError({}).message, "Non-Error object thrown");
  });
});
