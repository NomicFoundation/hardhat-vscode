import { ErrorEvent } from "@sentry/core";
import { assert } from "chai";
import { anonymizeEvent } from "../../src/telemetry/anonymization";

describe("anonymization", () => {
  describe("anonymizeEvent", () => {
    describe("message anonymization", () => {
      it("anonymizes solidity file paths and urls in message", () => {
        const event: ErrorEvent = {
          type: undefined,
          message:
            "file:///test/path/file.sol /absolute/path/file.sol C:\\absolute\\path\\file.sol contracts/MyContract.sol contracts\\MyContract.sol",
        };

        const anonymizedEvent = anonymizeEvent(event);

        assert.strictEqual(
          anonymizedEvent.message,
          "<user-file> <user-file> <user-file> <user-file> <user-file>"
        );
      });

      it("anonymizes javascript files if they dont belong to the extension", async () => {
        const event: ErrorEvent = {
          type: undefined,
          message:
            "file:///test/path/file.js /absolute/path/file.js C:\\absolute\\path\\file.js contracts/MyContract.js contracts\\MyContract.js",
        };

        const anonymizedEvent = anonymizeEvent(event);

        assert.strictEqual(
          anonymizedEvent.message,
          "<user-file> <user-file> <user-file> <user-file> <user-file>"
        );
      });

      it("anonymizes javascript files if they belong to the extension", async () => {
        const event: ErrorEvent = {
          type: undefined,
          message:
            "file:///user_path/nomicfoundation.hardhat-solidity-0.8.20/internal_path/file.js /user_path/nomicfoundation.hardhat-solidity-0.8.20/internal_path/file2.js C:\\user_path\\nomicfoundation.hardhat-solidity-0.8.20\\internal_path\\file3.js /c:/user_path/nomicfoundation.hardhat-solidity-0.8.20/internal_path/file4.js ",
        };

        const anonymizedEvent = anonymizeEvent(event);

        assert.strictEqual(
          anonymizedEvent.message,
          "<extension-root>/internal_path/file.js <extension-root>/internal_path/file2.js <extension-root>\\internal_path\\file3.js <extension-root>/internal_path/file4.js "
        );
      });
    });

    describe("breadcrumbs anonymization", () => {
      it("anonymizes breadcrumbs", () => {
        const event: ErrorEvent = {
          type: undefined,
          breadcrumbs: [
            {
              message: "error in file /test/path/file.sol",
            },
            {
              message: "error in file c:\\test\\path\\file.sol",
            },
            {
              message: "error in file file:///test/path/file.sol",
            },
            {
              message: "error in file /c:/test/path/file.sol",
            },
          ],
        };

        const anonymizedEvent = anonymizeEvent(event);

        assert.deepEqual(anonymizedEvent.breadcrumbs, [
          { message: "error in file <user-file>" },
          { message: "error in file <user-file>" },
          { message: "error in file <user-file>" },
          { message: "error in file <user-file>" },
        ]);
      });
    });

    describe("exception anonymization", () => {
      it("anonymizes exception values and modules", () => {
        const event: ErrorEvent = {
          type: undefined,
          exception: {
            values: [
              {
                value: "error in file /test/path/file.sol",
                module: "file:///test/path/file.sol",
              },
              {
                value: "error in file c:\\test\\path\\file.sol",
                module: "C:\\test\\path\\file.sol",
              },
              {
                value: "error in file file:///test/path/file.sol",
                module: "file:///test/path/file.sol",
              },
              {
                value: "error in file /c:/test/path/file.sol",
                module: "C:\\test\\path\\file.sol",
              },
            ],
          },
        };

        const anonymizedEvent = anonymizeEvent(event);

        assert.deepEqual(anonymizedEvent.exception?.values, [
          {
            value: "error in file <user-file>",
            stacktrace: undefined,
            module: "<user-file>",
          },
          {
            value: "error in file <user-file>",
            stacktrace: undefined,
            module: "<user-file>",
          },
          {
            value: "error in file <user-file>",
            stacktrace: undefined,
            module: "<user-file>",
          },
          {
            value: "error in file <user-file>",
            stacktrace: undefined,
            module: "<user-file>",
          },
        ]);
      });

      it("anonymizes exception stacktraces", () => {
        const event: ErrorEvent = {
          type: undefined,
          exception: {
            values: [
              {
                value: "error in file /test/path/file.sol",
                module: "file:///test/path/file.sol",
                stacktrace: {
                  frames: [
                    {
                      filename: "file:///test/path/file.sol",
                      abs_path: "/test/path/file.sol",
                      module: "file:///test/path/file.sol",
                    },
                    {
                      filename: "C:\\test\\path\\file.sol",
                      abs_path: "C:\\test\\path\\file.sol",
                      module: "C:\\test\\path\\file.sol",
                    },
                    {
                      filename: "file:///test/path/file.sol",
                      abs_path: "/test/path/file.sol",
                      module: "file:///test/path/file.sol",
                    },
                    {
                      filename: "C:\\test\\path\\file.sol",
                      abs_path: "C:\\test\\path\\file.sol",
                      module: "C:\\test\\path\\file.sol",
                    },
                  ],
                },
              },
            ],
          },
        };

        const anonymizedEvent = anonymizeEvent(event);

        assert.deepEqual(anonymizedEvent.exception?.values, [
          {
            value: "error in file <user-file>",
            module: "<user-file>",
            stacktrace: {
              frames: [
                {
                  filename: "<user-file>",
                  abs_path: "<user-file>",
                  module: "<user-file>",
                },
                {
                  filename: "<user-file>",
                  abs_path: "<user-file>",
                  module: "<user-file>",
                },
                {
                  filename: "<user-file>",
                  abs_path: "<user-file>",
                  module: "<user-file>",
                },
                {
                  filename: "<user-file>",
                  abs_path: "<user-file>",
                  module: "<user-file>",
                },
              ],
            },
          },
        ]);
      });
    });

    describe("user anonymization", () => {
      it("anonymizes user", () => {
        const event: ErrorEvent = {
          type: undefined,
          user: {
            username: "user",
            email: "user@email.com",
          },
        };
        const anonymizedEvent = anonymizeEvent(event);
        assert.deepEqual(anonymizedEvent.user, {
          username: undefined,
          email: undefined,
        });
      });
    });

    it("removes server_name", () => {
      const event: ErrorEvent = {
        type: undefined,
        server_name: "server_name",
      };
      const anonymizedEvent = anonymizeEvent(event);
      assert.deepEqual(anonymizedEvent.server_name, undefined);
    });
  });
});
