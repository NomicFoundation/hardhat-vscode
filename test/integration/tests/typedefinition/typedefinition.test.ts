import { getClient } from "../../client";
import { Client } from "../../common/types";
import { assertLspCommand } from "../../common/assertLspCommand";
import { getDocUri } from "../../common/helper";

suite("Single-file Navigation", function () {
  this.timeout(10000);

  const testUri = getDocUri(__dirname, "./Test.sol");
  const importedUri = getDocUri(__dirname, "./Imported.sol");

  let client!: Client;

  suiteSetup(async () => {
    client = await getClient();
  });

  test("[Single-file] - Go to Type Definition", async () => {
    await assertLspCommand(client, {
      action: "TypeDefinitionRequest",
      uri: testUri.path,
      params: {
        position: {
          line: 26,
          character: 12,
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
      ],
    });
  });

  test("[Single-file][Defined after usage] - Go to Type Definition", async () => {
    await assertLspCommand(client, {
      action: "TypeDefinitionRequest",
      uri: testUri.path,
      params: {
        position: {
          line: 21,
          character: 16,
        },
      },
      expected: [
        {
          uri: {
            path: "./Test.sol",
          },
          range: [
            {
              line: 53,
              character: 11,
            },
            {
              line: 53,
              character: 19,
            },
          ],
        },
      ],
    });
  });

  test("[Single-file][Multi types] - Go to Type Definition", async () => {
    await assertLspCommand(client, {
      action: "TypeDefinitionRequest",
      uri: testUri.path,
      params: {
        position: {
          line: 38,
          character: 25,
        },
      },
      expected: [
        {
          uri: {
            path: "./Test.sol",
          },
          range: [
            {
              line: 53,
              character: 11,
            },
            {
              line: 53,
              character: 19,
            },
          ],
        },
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
      ],
    });
  });

  test("[Single-file] - Go to balance Type Definition", async () => {
    await assertLspCommand(client, {
      action: "TypeDefinitionRequest",
      uri: importedUri.path,
      params: {
        position: {
          line: 21,
          character: 20,
        },
      },
      expected: [
        {
          uri: {
            path: "./Imported.sol",
          },
          range: [
            {
              line: 3,
              character: 7,
            },
            {
              line: 3,
              character: 14,
            },
          ],
        },
      ],
    });
  });
});
