import { TextDocumentChangeEvent } from "vscode-languageserver";
import { TextDocument } from "vscode-languageserver-textdocument";
import { getOrInitialiseSolFileEntry } from "@utils/getOrInitialiseSolFileEntry";
import { analyzeSolFile } from "@analyzer/analyzeSolFile";
import { parse, visit } from "@solidity-parser/parser";
import { decodeUriAndRemoveFilePrefix, isTestMode } from "../../utils/index";
import { ServerState } from "../../types";

export async function analyse(
  serverState: ServerState,
  { document: changeDoc }: TextDocumentChangeEvent<TextDocument>
) {
  serverState.logger.trace("analyse");

  console.log(`Analyze: start`);
  try {
    const internalUri = decodeUriAndRemoveFilePrefix(changeDoc.uri);
    const solFileEntry = getOrInitialiseSolFileEntry(serverState, internalUri);

    await analyzeSolFile(serverState, solFileEntry, changeDoc.getText());

    // console.log(JSON.stringify(solFileEntry.ast, null, 2));

    const ast = parse(changeDoc.getText(), {
      tolerant: true,
      loc: true,
      range: true,
    });
    // visit(ast, {
    //   MemberAccess: (node) => console.log(JSON.stringify(node, null, 2)),
    // });
    // console.log(solFileEntry.analyzerTree.tree.toString());

    // Notify that a file was successfully
    if (isTestMode()) {
      serverState.connection.sendNotification("custom/analyzed", {
        uri: changeDoc.uri,
      });
    }
  } catch (err) {
    serverState.logger.error(err);
  }
  // console.log(`Analyze: end`);
}
