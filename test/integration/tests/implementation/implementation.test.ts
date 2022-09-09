import { getClient } from "../../client";
import { Client } from "../../common/types";
import { assertLspCommand } from "../../common/assertLspCommand";
import { getTestContractUri } from "../../helpers/getTestContract";

suite("Single-file Navigation", function () {
  const testUri = getTestContractUri("main/contracts/implementation/Test.sol");

  let client!: Client;

  suiteSetup(async () => {
    client = await getClient();
  });

  test("[Single-file] - Find All Implementations", async () => {
    await assertLspCommand(client, {
      action: "ImplementationRequest",
      uri: testUri.path,
      params: {
        position: {
          line: 53,
          character: 15,
        },
      },
      expected: [
        {
          uri: {
            path: testUri.path,
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
            path: testUri.path,
          },
          range: [
            {
              line: 15,
              character: 4,
            },
            {
              line: 15,
              character: 12,
            },
          ],
        },
        {
          uri: {
            path: testUri.path,
          },
          range: [
            {
              line: 18,
              character: 8,
            },
            {
              line: 18,
              character: 16,
            },
          ],
        },
        {
          uri: {
            path: testUri.path,
          },
          range: [
            {
              line: 38,
              character: 100,
            },
            {
              line: 38,
              character: 108,
            },
          ],
        },
      ],
    });
  });
});
