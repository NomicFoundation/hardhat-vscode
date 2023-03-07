import { SignatureHelpParams } from "vscode-languageserver/node";
import { onCommand } from "@utils/onCommand";
import {
  VSCodePosition,
  ISolFileEntry,
  Position,
  Node,
  TextDocument,
  SignatureHelp,
  SignatureInformation,
  ParameterInformation,
  FunctionDefinitionNode,
} from "@common/types";
import { Logger } from "@utils/Logger";
import { isCharacterALetter, isCharacterANumber } from "../../utils";
import { ServerState } from "../../types";

interface DeclarationSignature {
  declarationNodePosition: Position;
  activeParameter: number;
}

export const onSignatureHelp = (serverState: ServerState) => {
  return (params: SignatureHelpParams): SignatureHelp | null | undefined => {
    try {
      return onCommand(
        serverState,
        "onSignatureHelp",
        params.textDocument.uri,
        (documentAnalyzer, document) =>
          signatureHelp(
            document,
            params.position,
            documentAnalyzer,
            serverState.logger
          )
      );
    } catch (err) {
      serverState.logger.error(err);

      return null;
    }
  };
};

function signatureHelp(
  document: TextDocument,
  vsCodePosition: VSCodePosition,
  documentAnalyzer: ISolFileEntry,
  logger: Logger
): SignatureHelp | undefined {
  if (documentAnalyzer.text === undefined) {
    return undefined;
  }

  const analyzerTree = documentAnalyzer.analyzerTree.tree;

  const declarationSignature = getDeclarationSignature(
    vsCodePosition,
    document
  );

  if (!declarationSignature) {
    return undefined;
  }

  const definitionNode = documentAnalyzer.searcher.findDefinitionNodeByPosition(
    documentAnalyzer.uri,
    declarationSignature.declarationNodePosition,
    analyzerTree
  );

  if (!definitionNode) {
    return undefined;
  }

  const definitionSignature = getDefinitionSignature(definitionNode, logger);

  if (!definitionSignature) {
    return undefined;
  }

  return {
    signatures: [definitionSignature],
    activeSignature: undefined,
    activeParameter: declarationSignature.activeParameter,
  };
}

function getDeclarationSignature(
  vsCodePosition: VSCodePosition,
  document: TextDocument
): DeclarationSignature | undefined {
  let activeParameter = 0;
  let declarationNodePosition!: Position;

  const offsetDocument = document
    .getText()
    .substring(0, document.offsetAt(vsCodePosition));

  for (let i = offsetDocument.length - 1; i >= 0; i--) {
    const char = offsetDocument.charAt(i);

    if (char === ";" || char === "}") {
      return undefined;
    }

    if (char === ",") {
      activeParameter++;
      continue;
    }

    if (char === "(") {
      declarationNodePosition = findDeclarationNodePosition(i, offsetDocument);
      break;
    }
  }

  return {
    declarationNodePosition,
    activeParameter,
  };
}

function getDefinitionSignature(
  definitionNode: Node,
  logger: Logger
): SignatureInformation | undefined {
  if (definitionNode.type === "ContractDefinition") {
    const constructorNode =
      getContractDefinitionConstructorNode(definitionNode);

    if (!constructorNode) {
      return undefined;
    }

    definitionNode = constructorNode;
  }

  if (
    definitionNode.type === "FunctionDefinition" ||
    definitionNode.type === "EventDefinition" ||
    definitionNode.type === "ModifierDefinition" ||
    definitionNode.type === "CustomErrorDefinition"
  ) {
    return getNodeDefinitionSignature(definitionNode, logger);
  }

  return undefined;
}

function getNodeDefinitionSignature(
  definitionNode: Node,
  logger: Logger
): SignatureInformation | undefined {
  const documentAnalyzer = definitionNode.solFileIndex[definitionNode.uri];
  const document = documentAnalyzer?.text;
  const nameLoc = definitionNode.nameLoc;

  if (document === undefined) {
    return undefined;
  }

  let offset: number;
  if (nameLoc) {
    offset = getOffsetFromPosition(nameLoc.start, document);
  } else if (definitionNode.astNode.loc) {
    offset = getOffsetFromPosition(
      {
        line: definitionNode.astNode.loc.start.line,
        column: definitionNode.astNode.loc.start.column,
      },
      document
    );
  } else {
    return undefined;
  }

  const documentation = getDefinitionNodeDocumentation(document, offset);

  let signature = document.substring(offset).split("{")[0];
  if (definitionNode.type === "FunctionDefinition") {
    if ((definitionNode as FunctionDefinitionNode).isConstructor) {
      // Get contract name
      signature =
        (definitionNode.parent?.getName() ?? "") +
        signature.slice("constructor".length);
    } else {
      signature = `function ${signature}`;
    }
  } else if (definitionNode.type === "EventDefinition") {
    signature = `event ${signature}`;
  } else if (definitionNode.type === "ModifierDefinition") {
    signature = `modifier ${signature}`;
  } else if (definitionNode.type === "CustomErrorDefinition") {
    signature = `error ${signature}`;
  }

  if (!signature) {
    logger.error(`Unable to parse signature for ${definitionNode.type}`);

    return undefined;
  }

  signature = signature.split(";")[0];
  const signatureSplited = signature.split("(");
  const stringParameters = signatureSplited[1].split(")")[0];

  let argumentOffset = signatureSplited[0].length + 1;

  const parameters: ParameterInformation[] = [];
  for (const stringParameter of stringParameters.split(",")) {
    if (stringParameter === "") {
      break;
    }

    parameters.push({
      label: [argumentOffset, argumentOffset + stringParameter.length],
    });

    argumentOffset += stringParameter.length + 1;
  }

  return {
    label: signature,
    documentation: documentation?.trim(),
    parameters,
  };
}

function getContractDefinitionConstructorNode(
  definitionNode: Node
): Node | undefined {
  for (const child of definitionNode.children) {
    if (
      child.type === "FunctionDefinition" &&
      (child as FunctionDefinitionNode).isConstructor
    ) {
      return child;
    }
  }

  return undefined;
}

function getDefinitionNodeDocumentation(
  document: string,
  limit: number
): string | undefined {
  const newDocument = document.substring(0, limit);
  const documentLines = newDocument.split("\n");
  let documentation = "";
  let isMultiLineComments = false;

  // documentLines.length - 2. Because last element in the documentLines is the node definition,
  // and we are looking one line above for the documentation.
  for (let i = documentLines.length - 2; i >= 0; i--) {
    const documentLine = documentLines[i];

    const trimmedLine = documentLine.trim();
    if (
      !isMultiLineComments &&
      trimmedLine[0] === "/" &&
      trimmedLine[1] === "/"
    ) {
      let singleComment = "//";
      if (trimmedLine[2] === "/") {
        singleComment = "///";
      }

      // Remove comment prefix
      const prettyDocumentLine = documentLine.split(singleComment, 2)[1];
      documentation = `${prettyDocumentLine}\n${documentation}`;
      continue;
    }
    if (trimmedLine[0] === "*" && trimmedLine[1] === "/") {
      isMultiLineComments = true;
      continue;
    }
    if (isMultiLineComments && trimmedLine[0] === "*") {
      // Remove comment prefix
      const prettyDocumentLine = documentLine.split("*", 2)[1];
      documentation = `${prettyDocumentLine}\n${documentation}`;
      continue;
    }

    break;
  }

  // Remove last new line
  return documentation.slice(0, -1);
}

function findDeclarationNodePosition(
  offset: number,
  document: string
): Position {
  let i;
  for (i = offset - 1; i >= 0; i--) {
    const char = document.charAt(i);

    if (isCharacterALetter(char) || isCharacterANumber(char)) {
      break;
    }
  }

  return getPositionFromOffset(i + 1, document);
}

function getOffsetFromPosition(position: Position, document: string): number {
  let offset = 0;
  const documentLines = document.split("\n");

  for (let i = 0; i < documentLines.length; i++) {
    const documentLine = documentLines[i];

    if (position.line - 1 === i) {
      return offset + position.column;
    }

    offset += documentLine.length + 1;
  }

  return offset;
}

function getPositionFromOffset(offset: number, document: string): Position {
  const documentLines = document.split("\n");

  let line = 1;
  let column = offset;
  // eslint-disable-next-line @typescript-eslint/prefer-for-of
  for (let i = 0; i < documentLines.length; i++) {
    const documentLineLength = documentLines[i].length + 1;

    if (column <= documentLineLength) {
      break;
    }

    column -= documentLineLength;
    line++;
  }

  return {
    line,
    column,
  };
}
