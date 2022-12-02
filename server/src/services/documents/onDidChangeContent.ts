import { TextDocumentChangeEvent } from "vscode-languageserver";
import { TextDocument } from "vscode-languageserver-textdocument";
import { debounce } from "../../utils/debounce";
import { ServerState } from "../../types";
import { analyse } from "../validation/analyse";
import { validate } from "../validation/validate";

type ChangeAction = (
  serverState: ServerState,
  change: TextDocumentChangeEvent<TextDocument>
) => void;

interface DocumentChangeActions {
  [uri: string]: ChangeAction;
}

interface FunctionDebounceState {
  action: ChangeAction;
  changeActions: DocumentChangeActions;
  wait: number;
}

interface DebounceState {
  analyse: FunctionDebounceState;
  validate: FunctionDebounceState;
}

export function onDidChangeContent(serverState: ServerState) {
  const debounceState: DebounceState = {
    analyse: {
      action: analyse,
      changeActions: {},
      wait: process.env.NODE_ENV === "test" ? 0 : 240,
    },
    validate: {
      action: validate,
      changeActions: {},
      wait: process.env.NODE_ENV === "test" ? 0 : 250,
    },
  };

  return (change: TextDocumentChangeEvent<TextDocument>) => {
    const { logger } = serverState;
    try {
      if (change.document.languageId !== "solidity") {
        return;
      }

      logger.trace("onDidChangeContent");

      debouncePerDocument(debounceState.analyse, serverState, change);
      debouncePerDocument(debounceState.validate, serverState, change);
    } catch (err) {
      logger.error(err);
    }
  };
}

function debouncePerDocument(
  { action, changeActions, wait }: FunctionDebounceState,
  serverState: ServerState,
  change: TextDocumentChangeEvent<TextDocument>
) {
  if (changeActions[change.document.uri] === undefined) {
    changeActions[change.document.uri] = debounce(action, wait);
  }

  changeActions[change.document.uri](serverState, change);
}
