// import { assert } from "chai";
// import { TextDocumentChangeEvent } from "vscode-languageserver";
// import { TextDocument } from "vscode-languageserver-textdocument";
// import { validate } from "../../../src/services/validation/validate";
// import { ServerState } from "../../../src/types";
// import { setupMockTelemetry } from "../../helpers/setupMockTelemetry";

// let serverState: ServerState;
// let change: TextDocumentChangeEvent<TextDocument>;

// beforeEach(async () => {
//   serverState = {
//     telemetry: setupMockTelemetry(),
//     indexingFinished: true,
//   } as unknown as ServerState;

//   change = {
//     document: {
//       uri: "foo.ts",
//     },
//   } as any;
// });

// describe.only("validate", function () {
//   it("returns if indexing stage is not finished", async () => {
//     serverState.indexingFinished = false;
//     const result = await validate(serverState, change);
//     assert.isFalse(result);
//   });
// });
