/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
  ContractDefinition,
  EventDefinition,
  FunctionDefinition,
  StateVariableDeclaration,
} from "@solidity-parser/parser/src/ast-types";
import * as parser from "@solidity-parser/parser";
import {
  CompletionContext,
  CompletionItem,
  InsertTextFormat,
} from "vscode-languageserver-protocol";
import {
  ISolFileEntry,
  TextDocument,
  VSCodePosition,
} from "../../parser/common/types";

export const getNatspecCompletion = (
  documentAnalyzer: ISolFileEntry,
  document: TextDocument,
  position: VSCodePosition
) => {
  // Check that the current line has the natspec string
  const searchString = "/** */";
  const lineText = document.getText({
    start: { line: position.line, character: 0 },
    end: { line: position.line + 1, character: 0 },
  });

  if (!lineText.includes(searchString)) {
    return null;
  }

  // Find the first node definition that allows natspec
  const currentOffset = document.offsetAt(position);
  let closestNode:
    | FunctionDefinition
    | ContractDefinition
    | EventDefinition
    | StateVariableDeclaration
    | undefined;

  const storeAsClosest = (
    node:
      | FunctionDefinition
      | ContractDefinition
      | StateVariableDeclaration
      | EventDefinition
  ) => {
    if (!node.range || node.range[0] < currentOffset) {
      return;
    }
    if (closestNode === undefined || node.range[0] < closestNode.range![0]) {
      closestNode = node;
    }
  };
  parser.visit(documentAnalyzer.analyzerTree.tree.astNode, {
    FunctionDefinition: storeAsClosest,
    ContractDefinition: storeAsClosest,
    StateVariableDeclaration: storeAsClosest,
    EventDefinition: storeAsClosest,
  });

  if (closestNode === undefined) {
    return null;
  }

  const items: CompletionItem[] = [];
  const range = {
    start: position,
    end: position,
  };

  // Generate natspec completion depending on node type
  switch (closestNode.type) {
    case "ContractDefinition":
      items.push(buildContractCompletion(closestNode, range));
      break;
    case "FunctionDefinition":
      items.push(buildFunctionCompletion(closestNode, range));
      break;
    case "StateVariableDeclaration":
      items.push(buildStateVariableCompletion(closestNode, range));
      break;
    case "EventDefinition":
      items.push(buildEventCompletion(closestNode, range));
      break;
  }

  return {
    isIncomplete: false,
    items,
  };
};

export const isNatspecTrigger = (context: CompletionContext | undefined) => {
  return context?.triggerCharacter === "*";
};

function buildContractCompletion(
  _node: ContractDefinition,
  range: {
    start: VSCodePosition;
    end: VSCodePosition;
  }
) {
  let text = "\n * @title $1\n";
  text += " * @author $2\n";
  text += " * @notice $3\n";
  text += " * @dev $4\n";

  return {
    label: "NatSpec contract documentation",
    textEdit: {
      range,
      newText: text,
    },
    insertTextFormat: InsertTextFormat.Snippet,
  };
}

function buildEventCompletion(
  node: EventDefinition,
  range: { start: VSCodePosition; end: VSCodePosition }
) {
  let text = "\n * @notice $0\n * @dev $1\n";

  let tabIndex = 2;
  for (const param of node.parameters) {
    text += ` * @param ${param.name} $\{${tabIndex++}}\n`;
  }

  return {
    label: "NatSpec event documentation",
    textEdit: {
      range,
      newText: text,
    },
    insertTextFormat: InsertTextFormat.Snippet,
  };
}

function buildStateVariableCompletion(
  node: StateVariableDeclaration,
  range: {
    start: VSCodePosition;
    end: VSCodePosition;
  }
) {
  const tags = [
    { name: "@notice", onlyPublic: true },
    { name: "@dev", onlyPublic: false },
    { name: "@return", onlyPublic: true },
  ];
  let text = "\n";
  let tabIndex = 1;
  for (const tag of tags) {
    if (!tag.onlyPublic || node.variables[0].visibility === "public") {
      text += ` * ${tag.name} $\{${tabIndex++}}\n`;
    }
  }

  return {
    label: "NatSpec variable documentation",
    textEdit: {
      range,
      newText: text,
    },
    insertTextFormat: InsertTextFormat.Snippet,
  };
}

function buildFunctionCompletion(
  node: FunctionDefinition,
  range: { start: VSCodePosition; end: VSCodePosition }
) {
  // Include @notice only on public or external functions
  let text = ["public", "external"].includes(node.visibility)
    ? "\n * @notice $0\n * @dev $1\n"
    : "\n * @dev $0\n";

  let tabIndex = 2;
  for (const param of node.parameters) {
    text += ` * @param ${param.name} $\{${tabIndex++}}\n`;
  }

  for (const param of node.returnParameters ?? []) {
    text += ` * @return ${
      typeof param.name === "string" ? `${param.name} ` : ""
    }$\{${tabIndex++}}\n`;
  }

  return {
    label: "NatSpec function documentation",
    textEdit: {
      range,
      newText: text,
    },
    insertTextFormat: InsertTextFormat.Snippet,
  };
}
