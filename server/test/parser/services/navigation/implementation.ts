import { assert } from "chai";
import * as path from "path";
import { VSCodePosition } from "@common/types";
import {
  OnImplementation,
  setupMockLanguageServer,
} from "../../../helpers/setupMockLanguageServer";
import { forceToUnixStyle } from "../../../helpers/forceToUnixStyle";

describe("Parser", () => {
  describe("Navigation", () => {
    describe("Implementation", () => {
      const implementationUri = forceToUnixStyle(
        path.join(__dirname, "testData", "Implementation.sol")
      );
      let implementation: OnImplementation;

      before(async () => {
        ({
          server: { implementation },
        } = await setupMockLanguageServer({
          documents: [{ uri: implementationUri, analyze: true }],
          errors: [],
        }));
      });

      describe("on functions", () => {
        describe("in interfaces", () => {
          it("should navigate from interface declaration to implementing functions", () =>
            assertImplementationNavigation(
              implementation,
              implementationUri,
              { line: 8, character: 11 },
              [
                {
                  start: { line: 12, character: 11 },
                  end: { line: 12, character: 21 },
                },
                {
                  start: { line: 18, character: 11 },
                  end: { line: 18, character: 21 },
                },
              ]
            ));
        });

        describe("in abstract classes", () => {
          it("should navigate from abstract function declaration to implementing functions", () =>
            assertImplementationNavigation(
              implementation,
              implementationUri,
              { line: 28, character: 11 },
              [
                {
                  start: { line: 32, character: 11 },
                  end: { line: 32, character: 21 },
                },
                {
                  start: { line: 38, character: 11 },
                  end: { line: 38, character: 21 },
                },
              ]
            ));
        });
      });
    });
  });
});

const assertImplementationNavigation = async (
  implementation: OnImplementation,
  uri: string,
  position: VSCodePosition,
  expectedRanges: { start: VSCodePosition; end: VSCodePosition }[]
) => {
  const response = await implementation({ textDocument: { uri }, position });

  if (!response || !Array.isArray(response)) {
    assert.fail();
  }

  assert.exists(response);

  assert.deepStrictEqual(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    response.map((elem: any) => elem.range).filter((x) => !!x),
    expectedRanges
  );
};
