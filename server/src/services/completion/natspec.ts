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
  Position,
} from "vscode-languageserver-protocol";
import {
  ISolFileEntry,
  TextDocument,
  VSCodePosition,
} from "../../parser/common/types";

enum NatspecStyle {
  "SINGLE_LINE",
  "MULTI_LINE",
}

export const getNatspecCompletion = (
  documentAnalyzer: ISolFileEntry,
  document: TextDocument,
  position: VSCodePosition
) => {
  // Check that the current line has the natspec string
  const multiLineSearchstring = "/** */";
  const singleLineSearchstring = "///";

  const lineText = document.getText({
    start: { line: position.line, character: 0 },
    end: { line: position.line + 1, character: 0 },
  });

  let style: NatspecStyle;

  if (lineText.includes(multiLineSearchstring)) {
    style = NatspecStyle.MULTI_LINE;
  } else if (lineText.includes(singleLineSearchstring)) {
    style = NatspecStyle.SINGLE_LINE;
  } else {
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
      items.push(buildContractCompletion(closestNode, range, style));
      break;
    case "FunctionDefinition":
      items.push(buildFunctionCompletion(closestNode, range, style));
      break;
    case "StateVariableDeclaration":
      items.push(buildStateVariableCompletion(closestNode, range, style));
      break;
    case "EventDefinition":
      items.push(buildEventCompletion(closestNode, range, style));
      break;
  }

  return {
    isIncomplete: false,
    items,
  };
};

export const isNatspecTrigger = (
  context: CompletionContext | undefined,
  document: TextDocument,
  position: Position
) => {
  const leadingText = document.getText({
    start: { line: position.line, character: position.character - 3 },
    end: { line: position.line, character: position.character },
  });

  return context?.triggerCharacter === "*" || leadingText === "///";
};

function buildContractCompletion(
  _node: ContractDefinition,
  range: {
    start: VSCodePosition;
    end: VSCodePosition;
  },
  style: NatspecStyle
) {
  let text = "";
  if (style === NatspecStyle.MULTI_LINE) {
    text += "\n * @title $1\n";
    text += " * @author $2\n";
    text += " * @notice $3\n";
  } else if (style === NatspecStyle.SINGLE_LINE) {
    text += " @title $1\n";
    text += "/// @author $2\n";
    text += "/// @notice $3";
  }

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
  range: { start: VSCodePosition; end: VSCodePosition },
  style: NatspecStyle
) {
  let text = "";
  let tabIndex = 1;

  if (style === NatspecStyle.MULTI_LINE) {
    text += "\n * $0\n";

    for (const param of node.parameters) {
      text += ` * @param ${param.name} $\{${tabIndex++}}\n`;
    }
  } else if (style === NatspecStyle.SINGLE_LINE) {
    text += " $0";

    for (const param of node.parameters) {
      text += `\n/// @param ${param.name} $\{${tabIndex++}}`;
    }
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
  },
  style: NatspecStyle
) {
  let text = "";
  if (style === NatspecStyle.MULTI_LINE) {
    if (node.variables[0].visibility === "public") {
      text = `\n * @notice $\{0}\n`;
    } else {
      text = `\n * @dev $\{0}\n`;
    }
  } else if (style === NatspecStyle.SINGLE_LINE) {
    if (node.variables[0].visibility === "public") {
      text = ` @notice $\{0}`;
    } else {
      text = ` @dev $\{0}`;
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
  range: { start: VSCodePosition; end: VSCodePosition },
  style: NatspecStyle
) {
  const isMultiLine = style === NatspecStyle.MULTI_LINE;
  const prefix = isMultiLine ? " *" : "///";
  const linesToAdd = [];

  // Include @notice only on public or external functions

  linesToAdd.push(`$0`);

  let tabIndex = 1;
  for (const param of node.parameters) {
    linesToAdd.push(`@param ${param.name} $\{${tabIndex++}}`);
  }

  if ((node.returnParameters ?? []).length >= 2) {
    for (const param of node.returnParameters ?? []) {
      linesToAdd.push(
        `@return ${
          typeof param.name === "string" ? `${param.name} ` : ""
        }$\{${tabIndex++}}`
      );
    }
  }

  let text = isMultiLine ? "\n" : "";

  text += linesToAdd
    .map((line, index) =>
      index !== 0 || isMultiLine ? `${prefix} ${line}` : ` ${line}`
    )
    .join("\n");

  if (isMultiLine) {
    text += "\n";
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
