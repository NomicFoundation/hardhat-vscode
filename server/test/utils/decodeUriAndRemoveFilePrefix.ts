import os from "os";
import { assert } from "chai";
import { decodeUriAndRemoveFilePrefix } from "@utils/index";

describe("utils", () => {
  describe("decodeUriAndRemoveFilePrefix", () => {
    it("should strip the file prefix", () => {
      if (os.platform() === "win32") {
        assertDecode(
          "file:///c:/Users/example/somefile.sol",
          "c:/Users/example/somefile.sol"
        );
      } else {
        assertDecode(
          "file:///Users/example/somefile.sol",
          "/Users/example/somefile.sol"
        );
      }
    });

    it("should convert to unix separator", () => {
      assertDecode(
        "c:\\Users\\example\\somefile.sol",
        "c:/Users/example/somefile.sol"
      );
    });

    it("should lowercase windows drive letters", () => {
      assertDecode(
        "C:/Users/example/somefile.sol",
        "c:/Users/example/somefile.sol"
      );

      assertDecode(
        "/C:/Users/example/somefile.sol",
        "/c:/Users/example/somefile.sol"
      );
    });
  });
});

function assertDecode(actual: string, expected: string) {
  assert.equal(decodeUriAndRemoveFilePrefix(actual), expected);
}
