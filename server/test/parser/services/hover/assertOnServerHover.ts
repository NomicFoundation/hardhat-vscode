import { assert } from "chai";
import { VSCodePosition } from "@common/types";
import { OnHover } from "../../../helpers/setupMockLanguageServer";
import { MarkupContent } from "vscode-languageserver/node";

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
