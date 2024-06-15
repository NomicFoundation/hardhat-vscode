import { expect } from "chai";
import { createFinders } from "@services/documentSymbol/onDocumentSymbol";

describe("documentSymbol", () => {
  it("can create and parse all queries successfully", () => {
    expect(() => createFinders()).to.not.throw();
  });
});
