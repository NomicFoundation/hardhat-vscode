import { visit } from "@solidity-parser/parser";
import { CodeLens, CodeLensParams } from "vscode-languageserver/node";
import { ServerState } from "../../types";
import { decodeUriAndRemoveFilePrefix } from "../../utils";

export const onCodeLens = (serverState: ServerState) => {
  return async (params: CodeLensParams): Promise<CodeLens[] | null> => {
    return serverState.telemetry.trackTiming("onCodeLens", async () => {
      const codeLens: CodeLens[] = [];

      const { logger } = serverState;

      logger.trace("onCodeLens");
      // console.log(JSON.stringify({ params }, null, 2));

      const uri = params.textDocument.uri;

      const solFileEntry =
        serverState.solFileIndex[decodeUriAndRemoveFilePrefix(uri)];

      if (solFileEntry === undefined) {
        console.log("no solfileindex");

        return { status: "failed_precondition", result: null };
      }

      const signaturesEntry = Object.entries(serverState.signatureIndex).find(
        ([sourceName, contractSignatures]) => uri.includes(sourceName)
      );

      if (signaturesEntry === undefined) {
        console.log("no signatures for source");
        return { status: "failed_precondition", result: null };
      }

      const signatures = signaturesEntry[1];

      // console.log({ signaturesEntry });

      const ast = solFileEntry.ast;

      let currentContract!: string;
      visit(ast, {
        ContractDefinition: (node) => {
          currentContract = node.name;
        },
        FunctionDefinition: (node) => {
          const functionName = node.name;
          if (functionName === null || node.loc === undefined) {
            return;
          }
          const signature = signatures[currentContract][functionName];
          if (signature === undefined) {
            return;
          }

          codeLens.push({
            range: {
              start: {
                character: node.loc.start.column,
                line: node.loc.start.line - 1,
              },
              end: {
                character: node.loc.end.column,
                line: node.loc.end.line - 1,
              },
            },
            command: {
              command: "",
              title: `0x${signature}`,
            },
          });
          console.log(`${functionName} => ${signature}`);
        },
      });

      // console.log({ ast });

      // console.log(JSON.stringify({ signatures }, null, 2));

      return { status: "ok", result: codeLens };
    });
  };
};
