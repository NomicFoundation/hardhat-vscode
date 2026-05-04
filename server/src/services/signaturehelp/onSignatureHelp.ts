import { SignatureHelpParams } from "vscode-languageserver/node";
import {
  Position,
  SignatureHelp,
  ParameterInformation,
} from "@common/types";
import type { CompilationUnit } from "@nomicfoundation/slang/compilation" with { "resolution-mode": "import" };
import {
  isCharacterALetter,
  isCharacterANumber,
} from "../../utils";
import { ServerState } from "../../types";
import { onCommand } from "../../utils/onCommand";
import {
  getCursorAtPosition,
  resolveIdentifierFromCursor,
  resolveToDefinition,
} from "../../parser/slangHelpers";
import { findConstructorInContract } from "../../parser/cstHelpers";

interface DeclarationSignature {
  declarationNodePosition: Position;
  activeParameter: number;
}

export const onSignatureHelp = (serverState: ServerState) => {
  return onCommand<SignatureHelpParams, SignatureHelp | null>(
    serverState,
    (unit, uri, params) =>
      signatureHelp(serverState, unit, uri, params),
    null
  );
};

async function signatureHelp(
  serverState: ServerState,
  unit: CompilationUnit,
  internalUri: string,
  params: SignatureHelpParams
): Promise<SignatureHelp | null> {
  // Get the document text for scanning
  const document = serverState.documents.get(params.textDocument.uri);

  if (document === undefined) {
    return null;
  }

  // Use text-based scanning to find the function call context
  const declarationSignature = getDeclarationSignature(
    params.position,
    document
  );

  if (!declarationSignature) {
    return null;
  }

  // The declarationNodePosition is in @solidity-parser format (1-based line)
  // Convert to 0-based
  const cursor = getCursorAtPosition(
    unit,
    internalUri,
    declarationSignature.declarationNodePosition.line - 1,
    declarationSignature.declarationNodePosition.column
  );

  if (cursor === undefined) {
    return null;
  }

  const resolution = await resolveIdentifierFromCursor(unit, cursor);

  if (resolution === undefined) {
    return null;
  }

  const definition = resolveToDefinition(resolution);

  if (definition === undefined) {
    return null;
  }

  // For constructor calls (new Foo()), the definition resolves to the contract.
  // We need to find the constructor within the contract and use its text directly.
  const nameLocation = definition.nameLocation;
  if (nameLocation.isUserFileLocation()) {
    const parentCursor = nameLocation.cursor.clone();
    if (parentCursor.goToParent() && parentCursor.node.isNonterminalNode() &&
        parentCursor.node.kind === "ContractDefinition") {
      const ctorCursor = await findConstructorInContract(parentCursor);
      if (ctorCursor !== undefined) {
        return parseSignatureFromText(ctorCursor.node.unparse(), declarationSignature.activeParameter);
      }
    }
  }

  const definiensLocation = definition.definiensLocation;

  if (!definiensLocation.isUserFileLocation()) {
    return null;
  }

  const rawDefiniensText = definiensLocation.cursor.node.unparse();
  return parseSignatureFromText(rawDefiniensText, declarationSignature.activeParameter);
}

/**
 * Parse a raw CST text into a SignatureHelp object.
 * Extracts natspec, strips comments, normalizes whitespace, and parses parameters.
 */
function parseSignatureFromText(
  rawText: string,
  activeParameter: number
): SignatureHelp | null {
  const documentation = extractNatspecFromText(rawText);

  const text = rawText
    .replace(/\/\*\*[\s\S]*?\*\//g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/\/[^\n]*/g, "")
    .replace(/\/\/[^\n]*/g, "")
    .trim();

  const braceIndex = text.indexOf("{");
  let signatureText =
    braceIndex > 0
      ? text.substring(0, braceIndex).trim()
      : text.trim();

  signatureText = signatureText.replace(/;$/, "").trim();
  signatureText = `${signatureText.replace(/\s+/g, " ")} `;

  if (signatureText.trim().length === 0) {
    return null;
  }

  const parenOpen = signatureText.indexOf("(");

  if (parenOpen < 0) {
    return null;
  }

  const parenClose = signatureText.indexOf(")", parenOpen);

  if (parenClose < 0) {
    return null;
  }

  const paramString = signatureText.substring(parenOpen + 1, parenClose);
  const parameters: ParameterInformation[] = [];

  if (paramString.trim().length > 0) {
    let argumentOffset = parenOpen + 1;

    for (const param of paramString.split(",")) {
      parameters.push({
        label: [argumentOffset, argumentOffset + param.length],
      });
      argumentOffset += param.length + 1;
    }
  }

  return {
    signatures: [
      {
        label: signatureText,
        parameters,
        ...(documentation !== undefined ? { documentation } : {}),
      },
    ],
    activeSignature: undefined,
    activeParameter,
  };
}

/**
 * Extract natspec documentation directly from the CST-unparsed text.
 */
function extractNatspecFromText(text: string): string | undefined {
  // Try multi-line comment: /** ... */
  const multiLineMatch = text.match(/\/\*\*([\s\S]*?)\*\//);

  if (multiLineMatch !== null) {
    const commentText = multiLineMatch[1]
      .split("\n")
      .map((l) => l.trim().replace(/^\*\s?/, "").trim())
      .filter((l) => l.length > 0 && !l.startsWith("@"))
      .join(" ")
      .trim();

    if (commentText.length > 0) {
      return commentText;
    }
  }

  // Try single-line natspec: /// ...
  const singleLineMatches = text.match(/\/\/\/[^\n]*/g);

  if (singleLineMatches !== null) {
    const commentText = singleLineMatches
      .map((l) => l.replace(/^\/\/\/\s?/, "").trim())
      .filter((l) => l.length > 0 && !l.startsWith("@"))
      .join(" ")
      .trim();

    if (commentText.length > 0) {
      return commentText;
    }
  }

  return undefined;
}

function getDeclarationSignature(
  vsCodePosition: { line: number; character: number },
  document: { getText: () => string; offsetAt: (pos: { line: number; character: number }) => number }
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

function findDeclarationNodePosition(
  offset: number,
  document: string
): Position {
  // Scan backward from '(' to find the end of the identifier
  let end = offset - 1;
  while (end >= 0) {
    const char = document.charAt(end);
    if (isCharacterALetter(char) || isCharacterANumber(char)) {
      break;
    }
    end--;
  }

  // Scan further backward to find the start of the identifier
  let start = end;
  while (start > 0) {
    const char = document.charAt(start - 1);
    if (!isCharacterALetter(char) && !isCharacterANumber(char)) {
      break;
    }
    start--;
  }

  return getPositionFromOffset(start, document);
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
