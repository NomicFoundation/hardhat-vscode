import { expect } from "chai";
import { createHighlighters } from "@services/semanticHighlight/onSemanticTokensFull";

describe("semanticHighlight", () => {
  it("can create and parse all queries successfully", () => {
    expect(() => createHighlighters()).to.not.throw();
  });
});
