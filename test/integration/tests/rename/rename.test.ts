import { getClient } from "../../client";
import { Client } from "../../common/types";
import { assertLspCommand } from "../../common/assertLspCommand";
import { getTestContractUri } from "../../helpers/getTestContract";

suite("Single-file Navigation", function () {
  const testUri = getTestContractUri("main/contracts/rename/Test.sol");
  const importTestUri = getTestContractUri(
    "main/contracts/rename/MultiImport.sol"
  );

  let client!: Client;

  suiteSetup(async () => {
    client = await getClient();
  });

  test("[Single-file][Identifier] - Do Rename", async () => {
    await assertLspCommand(client, {
      action: "RenameRequest",
      uri: testUri.path,
      params: {
        position: {
          line: 21,
          character: 17,
        },
        new_name: "identifier",
      },
      expected: [
        [
          {
            path: testUri.path,
          },
          [
            {
              range: [
                {
                  line: 15,
                  character: 22,
                },
                {
                  line: 15,
                  character: 31,
                },
              ],
              newText: "identifier",
            },
            {
              range: [
                {
                  line: 21,
                  character: 12,
                },
                {
                  line: 21,
                  character: 21,
                },
              ],
              newText: "identifier",
            },
            {
              range: [
                {
                  line: 50,
                  character: 15,
                },
                {
                  line: 50,
                  character: 24,
                },
              ],
              newText: "identifier",
            },
            {
              range: [
                {
                  line: 50,
                  character: 25,
                },
                {
                  line: 50,
                  character: 34,
                },
              ],
              newText: "identifier",
            },
          ],
        ],
      ],
    });
  });

  test("[Single-file][MemberAccess] - Do Rename", async () => {
    await assertLspCommand(client, {
      action: "RenameRequest",
      uri: testUri.path,
      params: {
        position: {
          line: 35,
          character: 31,
        },
        new_name: "memberAccess",
      },
      expected: [
        [
          {
            path: testUri.path,
          },
          [
            {
              range: [
                {
                  line: 11,
                  character: 16,
                },
                {
                  line: 11,
                  character: 24,
                },
              ],
              newText: "memberAccess",
            },
            {
              range: [
                {
                  line: 35,
                  character: 27,
                },
                {
                  line: 35,
                  character: 35,
                },
              ],
              newText: "memberAccess",
            },
            {
              range: [
                {
                  line: 45,
                  character: 12,
                },
                {
                  line: 45,
                  character: 20,
                },
              ],
              newText: "memberAccess",
            },
          ],
        ],
      ],
    });
  });

  test("[Multi-file][MemberAccess] - Do Rename", async () => {
    await assertLspCommand(client, {
      action: "RenameRequest",
      uri: importTestUri.path,
      params: {
        position: {
          line: 17,
          character: 42,
        },
        new_name: "name1",
      },
      expected: [
        [
          {
            path: getTestContractUri("main/contracts/rename/Foo.sol").path,
          },
          [
            {
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
              newText: "name1",
            },
          ],
        ],
        [
          {
            path: importTestUri.path,
          },
          [
            {
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
              newText: "name1",
            },
            {
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
              newText: "name1",
            },
          ],
        ],
      ],
    });
  });
});
