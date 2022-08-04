import { getClient } from "../../client";
import { Client } from "../../common/types";
import { assertLspCommand } from "../../common/assertLspCommand";
import { getDocUri } from "../../helpers/docPaths";

suite("Single-file Navigation", function () {
  this.timeout(10000);

  const testUri = getDocUri(__dirname, "./Test.sol");
  const importedUri = getDocUri(__dirname, "./Imported.sol");
  const modifierInvocationUri = getDocUri(
    __dirname,
    "./ModifierInvocation.sol"
  );
  const fooUri = getDocUri(__dirname, "./Foo.sol");

  let client!: Client;

  suiteSetup(async () => {
    client = await getClient();
  });

  test("[Single-file] - Find All References", async () => {
    await assertLspCommand(client, {
      action: "ReferencesRequest",
      uri: testUri.path,
      params: {
        position: {
          line: 9,
          character: 14,
        },
      },
      expected: [
        {
          uri: {
            path: "./Test.sol",
          },
          range: [
            {
              line: 9,
              character: 11,
            },
            {
              line: 9,
              character: 16,
            },
          ],
        },
        {
          uri: {
            path: "./Test.sol",
          },
          range: [
            {
              line: 14,
              character: 23,
            },
            {
              line: 14,
              character: 28,
            },
          ],
        },
        {
          uri: {
            path: "./Test.sol",
          },
          range: [
            {
              line: 38,
              character: 119,
            },
            {
              line: 38,
              character: 124,
            },
          ],
        },
        {
          uri: {
            path: "./Test.sol",
          },
          range: [
            {
              line: 43,
              character: 12,
            },
            {
              line: 43,
              character: 17,
            },
          ],
        },
      ],
    });
  });

  test("[Single-file] - Find All References for InsufficientBalance", async () => {
    await assertLspCommand(client, {
      action: "ReferencesRequest",
      uri: importedUri.path,
      params: {
        position: {
          line: 11,
          character: 15,
        },
      },
      expected: [
        {
          uri: {
            path: "./Imported.sol",
          },
          range: [
            {
              line: 11,
              character: 6,
            },
            {
              line: 11,
              character: 25,
            },
          ],
        },
        {
          uri: {
            path: "./Imported.sol",
          },
          range: [
            {
              line: 20,
              character: 19,
            },
            {
              line: 20,
              character: 38,
            },
          ],
        },
        {
          uri: {
            path: "./ImportTest.sol",
          },
          range: [
            {
              line: 12,
              character: 19,
            },
            {
              line: 12,
              character: 38,
            },
          ],
        },
      ],
    });
  });

  test("[Single-file] - Find All References for InsufficientBalance balance parameter", async () => {
    await assertLspCommand(client, {
      action: "ReferencesRequest",
      uri: importedUri.path,
      params: {
        position: {
          line: 11,
          character: 38,
        },
      },
      expected: [
        {
          uri: {
            path: "./Imported.sol",
          },
          range: [
            {
              line: 11,
              character: 34,
            },
            {
              line: 11,
              character: 41,
            },
          ],
        },
        {
          uri: {
            path: "./Imported.sol",
          },
          range: [
            {
              line: 21,
              character: 16,
            },
            {
              line: 21,
              character: 23,
            },
          ],
        },
        {
          uri: {
            path: "./ImportTest.sol",
          },
          range: [
            {
              line: 13,
              character: 16,
            },
            {
              line: 13,
              character: 23,
            },
          ],
        },
      ],
    });
  });

  test("[Single-file] - Find All References for AbstractVault", async () => {
    await assertLspCommand(client, {
      action: "ReferencesRequest",
      uri: modifierInvocationUri.path,
      params: {
        position: {
          line: 16,
          character: 26,
        },
      },
      expected: [
        {
          uri: {
            path: "./ModifierInvocation.sol",
          },
          range: [
            {
              line: 5,
              character: 4,
            },
            {
              line: 5,
              character: 15,
            },
          ],
        },
        {
          uri: {
            path: "./ModifierInvocation.sol",
          },
          range: [
            {
              line: 16,
              character: 19,
            },
            {
              line: 16,
              character: 32,
            },
          ],
        },
      ],
    });
  });

  test("[Single-file] - Find All References for 'fee' modifier", async () => {
    await assertLspCommand(client, {
      action: "ReferencesRequest",
      uri: modifierInvocationUri.path,
      params: {
        position: {
          line: 24,
          character: 55,
        },
      },
      expected: [
        {
          uri: {
            path: "./ModifierInvocation.sol",
          },
          range: [
            {
              line: 9,
              character: 13,
            },
            {
              line: 9,
              character: 16,
            },
          ],
        },
        {
          uri: {
            path: "./ModifierInvocation.sol",
          },
          range: [
            {
              line: 24,
              character: 53,
            },
            {
              line: 24,
              character: 56,
            },
          ],
        },
      ],
    });
  });

  test("[Single-file] - Find All References for 'fee1' modifier", async () => {
    await assertLspCommand(client, {
      action: "ReferencesRequest",
      uri: modifierInvocationUri.path,
      params: {
        position: {
          line: 24,
          character: 72,
        },
      },
      expected: [
        {
          uri: {
            path: "./ModifierInvocation.sol",
          },
          range: [
            {
              line: 20,
              character: 13,
            },
            {
              line: 20,
              character: 17,
            },
          ],
        },
        {
          uri: {
            path: "./ModifierInvocation.sol",
          },
          range: [
            {
              line: 24,
              character: 70,
            },
            {
              line: 24,
              character: 74,
            },
          ],
        },
      ],
    });
  });

  test("[Single-file] - Find All References for 'fee2' modifier", async () => {
    await assertLspCommand(client, {
      action: "ReferencesRequest",
      uri: modifierInvocationUri.path,
      params: {
        position: {
          line: 24,
          character: 90,
        },
      },
      expected: [
        {
          uri: {
            path: "./ModifierInvocation.sol",
          },
          range: [
            {
              line: 28,
              character: 13,
            },
            {
              line: 28,
              character: 17,
            },
          ],
        },
        {
          uri: {
            path: "./ModifierInvocation.sol",
          },
          range: [
            {
              line: 24,
              character: 88,
            },
            {
              line: 24,
              character: 92,
            },
          ],
        },
      ],
    });
  });

  test("[Multi-file] - Find All References", async () => {
    await assertLspCommand(client, {
      action: "ReferencesRequest",
      uri: fooUri.path,
      params: {
        position: {
          line: 6,
          character: 20,
        },
      },
      expected: [
        {
          uri: {
            path: "./Foo.sol",
          },
          range: [
            {
              line: 6,
              character: 18,
            },
            {
              line: 6,
              character: 22,
            },
          ],
        },
        {
          uri: {
            path: "./MultiImport.sol",
          },
          range: [
            {
              line: 13,
              character: 19,
            },
            {
              line: 13,
              character: 23,
            },
          ],
        },
        {
          uri: {
            path: "./MultiImport.sol",
          },
          range: [
            {
              line: 17,
              character: 40,
            },
            {
              line: 17,
              character: 44,
            },
          ],
        },
      ],
    });
  });
});
