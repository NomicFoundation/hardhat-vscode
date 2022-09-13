import path from "path";
import { Uri } from "vscode";
import { getClient } from "../../client";
import { Client } from "../../common/types";
import { assertLspCommand } from "../../common/assertLspCommand";
import { getTestContractUri } from "../../helpers/getTestContract";
import { getRootPath } from "../../helpers/workspace";

suite("Single-file Navigation", function () {
  this.timeout(10000);

  const testUri = getTestContractUri("main/contracts/definition/Test.sol");
  const importTestUri = getTestContractUri(
    "main/contracts/definition/ImportTest.sol"
  );

  let client!: Client;

  suiteSetup(async () => {
    client = await getClient();
  });

  test("[Single-file] - Go to Definition", async () => {
    await assertLspCommand(client, {
      action: "DefinitionRequest",
      uri: testUri.path,
      params: {
        position: {
          line: 14,
          character: 25,
        },
      },
      expected: [
        {
          uri: {
            path: getTestContractUri("main/contracts/definition/Test.sol").path,
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

  test("[Single-file][Defined after usage] - Go to Definition", async () => {
    await assertLspCommand(client, {
      action: "DefinitionRequest",
      uri: testUri.path,
      params: {
        position: {
          line: 15,
          character: 9,
        },
      },
      expected: [
        {
          uri: {
            path: getTestContractUri("main/contracts/definition/Test.sol").path,
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

  test("[Single-file][MemberAccess] - Go to Definition", async () => {
    await assertLspCommand(client, {
      action: "DefinitionRequest",
      uri: testUri.path,
      params: {
        position: {
          line: 26,
          character: 25,
        },
      },
      expected: [
        {
          uri: {
            path: getTestContractUri("main/contracts/definition/Test.sol").path,
          },
          range: [
            {
              line: 10,
              character: 13,
            },
            {
              line: 10,
              character: 18,
            },
          ],
        },
      ],
    });
  });

  test("[Single-file][MemberAccess][Defined after usage] - Go to Definition", async () => {
    await assertLspCommand(client, {
      action: "DefinitionRequest",
      uri: testUri.path,
      params: {
        position: {
          line: 50,
          character: 50,
        },
      },
      expected: [
        {
          uri: {
            path: getTestContractUri("main/contracts/definition/Test.sol").path,
          },
          range: [
            {
              line: 54,
              character: 16,
            },
            {
              line: 54,
              character: 20,
            },
          ],
        },
      ],
    });
  });

  test("Jump to import file", async () => {
    await assertLspCommand(client, {
      action: "DefinitionRequest",
      uri: importTestUri.path,
      params: {
        position: {
          line: 3,
          character: 25,
        },
      },
      expected: [
        {
          uri: {
            path: getTestContractUri("main/contracts/definition/Foo.sol").path,
          },
          range: [
            {
              line: 1,
              character: 0,
            },
            {
              line: 6,
              character: 0,
            },
          ],
        },
      ],
    });
  });

  test("Jump to import dependency file", async () => {
    await assertLspCommand(client, {
      action: "DefinitionRequest",
      uri: importTestUri.path,
      params: {
        position: {
          line: 4,
          character: 73,
        },
      },
      expected: [
        {
          uri: {
            path: Uri.file(
              path.join(
                getRootPath(),
                "node_modules/@openzeppelin/contracts/access/Ownable.sol"
              )
            ).path,
          },
          range: [
            {
              line: 3,
              character: 0,
            },
            {
              line: 76,
              character: 0,
            },
          ],
        },
      ],
    });
  });
});
