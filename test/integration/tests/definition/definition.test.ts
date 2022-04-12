import * as path from "path";
import { getClient } from "../../client";
import { Client } from "../../common/types";
import { assertLspCommand } from "../../common/assertLspCommand";
import { getDocUri } from "../../common/helper";

suite("Single-file Navigation", function () {
  this.timeout(10000);

  const testUri = getDocUri(__dirname, "./Test.sol");
  const importTestUri = getDocUri(__dirname, "./ImportTest.sol");

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
            path: "Test.sol",
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
            path: "./Test.sol",
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
            path: "./Test.sol",
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
            path: "./Foo.sol",
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
    let expectedPath = path
      .join(
        __dirname,
        "../node_modules/@openzeppelin/contracts/access/Ownable.sol"
      )
      .replace("/out/", "/")
      .replace("\\out\\", "\\")
      .replace(/\\/g, "/");

    expectedPath = expectedPath.startsWith("/")
      ? expectedPath
      : `/${expectedPath}`;

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
            path: expectedPath,
          },
          range: [
            {
              line: 2,
              character: 0,
            },
            {
              line: 71,
              character: 0,
            },
          ],
        },
      ],
    });
  });
});
