import { assert } from "chai";
import * as fs from "fs";
import * as path from "path";
import { TextDocument } from "vscode-languageserver-textdocument";
import { MarkContractAbstract } from "@compilerDiagnostics/diagnostics/MarkContractAbstract";
import { indexWorkspaceFolders } from "@services/initialization/indexWorkspaceFolders";
import { setupMockWorkspaceFileRetriever } from "../../helpers/setupMockWorkspaceFileRetriever";
import { setupMockLogger } from "../../helpers/setupMockLogger";
import { setupMockConnection } from "../../helpers/setupMockConnection";
import { ServerState } from "../../../src/types";
import { assertCodeAction } from "./asserts/assertCodeAction";

describe("Code Actions", () => {
  describe("Mark Contract Abstract", () => {
    describe("no-inheritance contract", () => {
      describe("extending no-inheritance interface", () => {
        const markContractAbstract = new MarkContractAbstract();
        let markContractAbstractText: string;

        before(async () => {
          markContractAbstractText = (
            await fs.promises.readFile(
              path.join(__dirname, "testData", "MarkContractAbstract.sol")
            )
          ).toString();
        });

        it("should provide code action to add abstract keyword", async () => {
          const diagnostic = {
            code: "3656",
            message: 'Contract "Counter" should be marked as abstract.',
            range: {
              start: { line: 7, character: 9 },
              end: { line: 7, character: 16 },
            },
            data: {
              functionSourceLocation: { start: 131, end: 162 },
            },
          };

          await assertCodeAction(
            markContractAbstract,
            markContractAbstractText,
            diagnostic,
            [
              null,
              {
                title: "Add abstract to contract declaration",
                kind: "quickfix",
                isPreferred: false,
                edits: [
                  {
                    newText: "abstract ",
                    range: {
                      start: {
                        line: 7,
                        character: 0,
                      },
                      end: {
                        line: 7,
                        character: 0,
                      },
                    },
                  },
                ],
              },
            ]
          );
        });

        it("should provide code action to implement missing interface functions", async () => {
          const diagnostic = {
            code: "3656",
            message: 'Contract "Counter" should be marked as abstract.',
            range: {
              start: { line: 7, character: 9 },
              end: { line: 7, character: 16 },
            },
            data: {
              functionSourceLocation: { start: 131, end: 162 },
            },
          };

          await assertCodeAction(
            markContractAbstract,
            markContractAbstractText,
            diagnostic,
            [
              {
                title: "Add missing functions from interfaces",
                kind: "quickfix",
                isPreferred: false,
                edits: [
                  {
                    newText:
                      "contract Counter is ICounter {\n    function increment() external pure override {}\n}",
                    range: {
                      start: {
                        line: 7,
                        character: 0,
                      },
                      end: {
                        line: 7,
                        character: 31,
                      },
                    },
                  },
                ],
              },
              null,
            ]
          );
        });

        it("should provide no action if it cannot parse the contract", async () => {
          const fileText = `  
          xcontract bad {`;

          const diagnostic = {
            code: "3656",
            message: 'Contract "weird" should be marked as abstract.',
            range: {
              start: { line: 1, character: 6 },
              end: { line: 1, character: 30 },
            },
            data: {
              functionSourceLocation: { start: 9, end: 32 },
            },
          };

          const exampleUri = "/example";

          const document = TextDocument.create(
            exampleUri,
            "solidity",
            0,
            fileText
          );

          const mockWorkspaceFileRetriever = setupMockWorkspaceFileRetriever();
          const mockLogger = setupMockLogger();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const mockConnection = setupMockConnection() as any;

          const serverState = {
            indexJobCount: 0,
            indexedWorkspaceFolders: [{ name: "example", uri: exampleUri }],
            projects: {},
            connection: mockConnection,
            solFileIndex: {},
            logger: mockLogger,
          } as unknown as ServerState;

          await indexWorkspaceFolders(
            serverState,
            mockWorkspaceFileRetriever,
            serverState.indexedWorkspaceFolders
          );

          const actions = markContractAbstract.resolveActions(
            serverState as ServerState,
            diagnostic,
            {
              document,
              uri: exampleUri,
            }
          );

          assert.deepStrictEqual(actions, []);
        });
      });

      describe("extending single inheritance interface", () => {
        const markContractAbstract = new MarkContractAbstract();
        let singleInterfaceInheritanceText: string;

        before(async () => {
          singleInterfaceInheritanceText = (
            await fs.promises.readFile(
              path.join(__dirname, "testData", "InterfaceInheritanceSingle.sol")
            )
          ).toString();
        });

        it("should provide code action to implement missing interface functions", async () => {
          const diagnostic = {
            code: "3656",
            message: 'Contract "Counter" should be marked as abstract.',
            range: {
              start: { line: 11, character: 9 },
              end: { line: 11, character: 29 },
            },
            data: {
              functionSourceLocation: { start: 213, end: 364 },
            },
          };

          await assertCodeAction(
            markContractAbstract,
            singleInterfaceInheritanceText,
            diagnostic,
            [
              {
                title: "Add missing functions from interfaces",
                kind: "quickfix",
                isPreferred: false,
                edits: [
                  {
                    newText:
                      "contract ImplementingContract is ExtendingInterface {\n    //   function inBase() external override {}\n    //   function inExtender() external override {}\n    function inBase() external override {}\n\n    function inExtender() external override {}\n}",
                    range: {
                      start: {
                        line: 11,
                        character: 0,
                      },
                      end: {
                        line: 14,
                        character: 1,
                      },
                    },
                  },
                ],
              },
              null,
            ]
          );
        });
      });

      describe("extending multi-inheriting interface", () => {
        const markContractAbstract = new MarkContractAbstract();
        let multiInterfaceInheritance: string;

        before(async () => {
          multiInterfaceInheritance = (
            await fs.promises.readFile(
              path.join(
                __dirname,
                "testData",
                "InterfaceInheritanceMultiple.sol"
              )
            )
          ).toString();
        });

        it("should provide code action to implement missing interface functions", async () => {
          const diagnostic = {
            code: "3656",
            message: 'Contract "Counter" should be marked as abstract.',
            range: {
              start: { line: 19, character: 9 },
              end: { line: 19, character: 23 },
            },
            data: {
              functionSourceLocation: { start: 428, end: 525 },
            },
          };

          await assertCodeAction(
            markContractAbstract,
            multiInterfaceInheritance,
            diagnostic,
            [
              {
                title: "Add missing functions from interfaces",
                kind: "quickfix",
                isPreferred: false,
                edits: [
                  {
                    newText:
                      "contract DiamondCounter is IDiamondIncrement, IDiamondDecrement {\n    uint120 public balance = 0;\n\n    function getBalance()\n        external\n        view\n        override(IDiamondCounter, IDiamondIncrement)\n        returns (uint120)\n    {}\n\n    function increment()\n        external\n        view\n        override(IDiamondDecrement, IDiamondIncrement)\n    {}\n\n    function decrement() external override {}\n}",
                    range: {
                      start: {
                        line: 19,
                        character: 0,
                      },
                      end: {
                        line: 21,
                        character: 1,
                      },
                    },
                  },
                ],
              },
              null,
            ]
          );
        });
      });

      describe("extending complex flowing interfaces", () => {
        const markContractAbstract = new MarkContractAbstract();
        let multiInterfaceInheritance: string;

        before(async () => {
          multiInterfaceInheritance = (
            await fs.promises.readFile(
              path.join(
                __dirname,
                "testData",
                "InterfaceInheritanceFlowing.sol"
              )
            )
          ).toString();
        });

        it("should provide code action to implement missing interface functions", async () => {
          const diagnostic = {
            code: "3656",
            message: 'Contract "I" should be marked as abstract.',
            range: {
              start: { line: 33, character: 9 },
              end: { line: 33, character: 10 },
            },
            data: {
              functionSourceLocation: { start: 537, end: 567 },
            },
          };

          await assertCodeAction(
            markContractAbstract,
            multiInterfaceInheritance,
            diagnostic,
            [
              {
                title: "Add missing functions from interfaces",
                kind: "quickfix",
                isPreferred: false,
                edits: [
                  {
                    newText:
                      "contract I is D, E, F, G, H {\n    function getBalance() external override(B, D, F) returns (uint120) {}\n}",
                    range: {
                      start: {
                        line: 33,
                        character: 0,
                      },
                      end: {
                        line: 33,
                        character: 30,
                      },
                    },
                  },
                ],
              },
              null,
            ]
          );
        });
      });
    });

    describe("inheriting contract", () => {
      describe("extending no-inheritance interface", () => {
        const markContractAbstract = new MarkContractAbstract();
        let markContractAbstractText: string;

        before(async () => {
          markContractAbstractText = (
            await fs.promises.readFile(
              path.join(
                __dirname,
                "testData",
                "InterfaceInheritanceWithContractInheritance.sol"
              )
            )
          ).toString();
        });

        it("should provide code action to implement missing interface functions", async () => {
          const diagnostic = {
            code: "3656",
            message: 'Contract "Child" should be marked as abstract.',
            range: {
              start: { line: 13, character: 9 },
              end: { line: 13, character: 14 },
            },
            data: {
              functionSourceLocation: { start: 220, end: 373 },
            },
          };

          await assertCodeAction(
            markContractAbstract,
            markContractAbstractText,
            diagnostic,
            [
              {
                title: "Add missing functions from interfaces",
                kind: "quickfix",
                isPreferred: false,
                edits: [
                  {
                    newText:
                      "contract Child is IExample, Parent {\n    //   function first() public virtual override(IExample, Parent) {}\n    //   function second() external override {}\n    function first() public override(IExample, Parent) {}\n\n    function second() external override {}\n}",
                    range: {
                      start: {
                        line: 13,
                        character: 0,
                      },
                      end: {
                        line: 16,
                        character: 1,
                      },
                    },
                  },
                ],
              },
              null,
            ]
          );
        });
      });
    });

    describe("inheriting from abstract contract", () => {
      describe("extending no-inheritance interface", () => {
        const markContractAbstract = new MarkContractAbstract();
        let markContractAbstractText: string;

        before(async () => {
          markContractAbstractText = (
            await fs.promises.readFile(
              path.join(
                __dirname,
                "testData",
                "InterfaceInheritanceWithAbstractInheritance.sol"
              )
            )
          ).toString();
        });

        it("should provide code action to implement missing interface functions", async () => {
          const diagnostic = {
            code: "3656",
            message: 'Contract "Child" should be marked as abstract.',
            range: {
              start: { line: 13, character: 9 },
              end: { line: 13, character: 14 },
            },
            data: {
              functionSourceLocation: { start: 241, end: 323 },
            },
          };

          await assertCodeAction(
            markContractAbstract,
            markContractAbstractText,
            diagnostic,
            [
              {
                title: "Add missing functions from interfaces",
                kind: "quickfix",
                isPreferred: false,
                edits: [
                  {
                    newText:
                      "contract Child is IExample, Parent {\n    // function second() external override {}\n    function second() external override {}\n}",
                    range: {
                      start: {
                        line: 13,
                        character: 0,
                      },
                      end: {
                        line: 15,
                        character: 1,
                      },
                    },
                  },
                ],
              },
              null,
            ]
          );
        });
      });
    });

    describe("inheriting from contract with diamond inheritance", () => {
      describe("extending diamond inheritance interface", () => {
        const markContractAbstract = new MarkContractAbstract();
        let interfaceInheritanceTwoDiamondsText: string;

        before(async () => {
          interfaceInheritanceTwoDiamondsText = (
            await fs.promises.readFile(
              path.join(
                __dirname,
                "testData",
                "InterfaceInheritanceTwoDiamonds.sol"
              )
            )
          ).toString();
        });

        it("should provide code action to implement missing interface functions", async () => {
          const diagnostic = {
            code: "3656",
            message: 'Contract "C" should be marked as abstract.',
            range: {
              start: { line: 45, character: 9 },
              end: { line: 45, character: 10 },
            },
            data: {
              functionSourceLocation: { start: 866, end: 1236 },
            },
          };

          await assertCodeAction(
            markContractAbstract,
            interfaceInheritanceTwoDiamondsText,
            diagnostic,
            [
              {
                title: "Add missing functions from interfaces",
                kind: "quickfix",
                isPreferred: false,
                edits: [
                  {
                    newText:
                      "contract C is ID, CH {\n    // function top() external override(CE, IA) returns (uint120) {}\n    // function topFromInterface() external override returns (uint120) {}\n    // function left() external override(CF, IB) returns (uint120) {}\n    // function right() external override(CG, IC) returns (uint120) {}\n    // function bottom() external override(CH, ID) returns (uint120) {}\n    function top() external override(CE, IA) returns (uint120) {}\n\n    function topFromInterface() external override returns (uint120) {}\n\n    function left() external override(CF, IB) returns (uint120) {}\n\n    function right() external override(CG, IC) returns (uint120) {}\n\n    function bottom() external override(CH, ID) returns (uint120) {}\n}",
                    range: {
                      start: {
                        line: 45,
                        character: 0,
                      },
                      end: {
                        line: 51,
                        character: 1,
                      },
                    },
                  },
                ],
              },
              null,
            ]
          );
        });
      });
    });
  });
});
