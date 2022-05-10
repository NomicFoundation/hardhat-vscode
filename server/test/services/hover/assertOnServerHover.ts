import { assert } from "chai";
import { VSCodePosition } from "@common/types";
import { MarkupContent } from "vscode-languageserver/node";
import { OnHover } from "../../helpers/setupMockLanguageServer";

export async function assertOnServerHover(
  hover: OnHover,
  uri: string,
  position: VSCodePosition,
  expectedContent: MarkupContent
): Promise<void> {
  const response = await hover({ textDocument: { uri }, position });

  if (!response) {
    assert.fail();
  }

  assert.deepStrictEqual(response.contents, expectedContent);
}
