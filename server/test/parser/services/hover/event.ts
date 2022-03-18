import * as path from "path";
import { VSCodePosition } from "@common/types";
import { setupMockLanguageServer } from "../../../helpers/setupMockLanguageServer";
import { forceToUnixStyle } from "../../../helpers/forceToUnixStyle";
import { MarkupKind } from "vscode-languageserver/node";
import { assertOnServerHover } from "./assertOnServerHover";

describe("Parser", () => {
  describe("Hover", () => {
    describe("Event", () => {
      const eventUri = forceToUnixStyle(
        path.join(__dirname, "testData", "Event.sol")
      );

      let assertHover: (
        position: VSCodePosition,
        expectedHoverText: string
      ) => Promise<void>;

      before(async () => {
        const {
          server: { hover },
        } = await setupMockLanguageServer({
          documents: [{ uri: eventUri, analyze: true }],
          errors: [],
        });

        await new Promise((resolve) => setTimeout(resolve, 500));

        assertHover = (position: VSCodePosition, expectedHoverText: string) =>
          assertOnServerHover(hover, eventUri, position, {
            kind: MarkupKind.Markdown,
            value: ["```solidity", expectedHoverText, "```"].join("\n"),
          });
      });

      it("should display details for parameterless event", () =>
        assertHover({ line: 38, character: 13 }, "event SimpleEvent()"));

      it("should display details for an event with parameters", () =>
        assertHover(
          { line: 39, character: 13 },
          "event ArgEvent(uint first, TodoStruct second, AuctionBase third, Status fourth)"
        ));

      it("should display details for an event inherited from a parent contract", () =>
        assertHover(
          { line: 40, character: 13 },
          "event BaseEvent(uint first)"
        ));
    });
  });
});
