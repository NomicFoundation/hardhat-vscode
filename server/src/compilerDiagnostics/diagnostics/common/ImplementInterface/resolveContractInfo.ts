/**
 * Build a ContractInfo tree from CST + BindingGraph.
 * Uses Slang AST typed wrappers for structured traversal.
 */
import type { CompilationUnit } from "@nomicfoundation/slang/compilation" with {
  "resolution-mode": "import",
};
import type { Cursor, NonterminalNode } from "@nomicfoundation/slang/cst" with {
  "resolution-mode": "import",
};
import { ParseContractDefinitionResult } from "../../parsing/parseContractDefinition";
import { ResolveActionsContext } from "../../../types";
import { ServerState } from "../../../../types";
import { getCompilationForFile } from "../../../../parser/compilation";
import { decodeUriAndRemoveFilePrefix } from "../../../../utils";
import {
  findContractAtByteOffset,
  getInheritedContracts,
  getSlangAst,
} from "../../../../parser/slangHelpers";
import { ContractInfo, FunctionInfo } from "./types";

// Module-level cache populated at entry by `await getSlangAst()`, then read
// synchronously by the recursive helpers below. Lets us avoid awaiting on
// every recursion step.
type SlangAstModule = Awaited<ReturnType<typeof getSlangAst>>;
let slangAst: SlangAstModule | undefined;

/**
 * Resolve a ContractInfo tree for the contract identified by the diagnostic.
 * Returns null if the contract cannot be found or compilation fails.
 */
export async function resolveContractInfo(
  serverState: ServerState,
  parseResult: ParseContractDefinitionResult,
  { document }: ResolveActionsContext
): Promise<ContractInfo | null> {
  const uri = decodeUriAndRemoveFilePrefix(document.uri);

  const unit = await getCompilationForFile(serverState, document.uri);

  if (unit === undefined) {
    return null;
  }

  const file = unit.file(uri);

  if (file === undefined) {
    return null;
  }

  // Ensure AST module is loaded once for the recursive helpers below.
  slangAst = await getSlangAst();

  // Find the ContractDefinition CST node at the diagnostic byte range
  const { functionSourceLocation, contractDefinition } = parseResult;

  if (!contractDefinition.range) {
    return null;
  }

  const targetStart =
    functionSourceLocation.start + contractDefinition.range[0];

  const cursor = file.createTreeCursor();
  const contractCursor = await findContractAtByteOffset(cursor, targetStart);

  if (contractCursor === undefined) {
    return null;
  }

  // Build ContractInfo recursively
  const seen = new Map<string, ContractInfo>();
  return buildContractInfo(unit, contractCursor, uri, seen);
}

/**
 * Build a ContractInfo from a CST ContractDefinition/InterfaceDefinition node.
 * Recursively resolves parent contracts/interfaces via BindingGraph.
 */
function buildContractInfo(
  unit: CompilationUnit,
  contractCursor: Cursor,
  fileUri: string,
  seen: Map<string, ContractInfo>
): ContractInfo | null {
  const contractNode = contractCursor.node.asNonterminalNode();

  if (contractNode === undefined) {
    return null;
  }

  const { ContractDefinition, InterfaceDefinition } = slangAst!;
  const name =
    contractNode.kind === "ContractDefinition"
      ? new ContractDefinition(contractNode).name.unparse()
      : new InterfaceDefinition(contractNode).name.unparse();

  const id = `${fileUri}::${name}`;

  // Avoid infinite recursion on diamond inheritance
  const existing = seen.get(id);

  if (existing !== undefined) {
    return existing;
  }

  const contentRange = getContentRange(contractCursor);
  const info: ContractInfo = {
    id,
    name,
    uri: fileUri,
    parents: [],
    functions: [],
    charRange: contentRange,
  };

  // Register early to handle cycles
  seen.set(id, info);

  // Extract functions from this contract using AST wrappers
  info.functions = extractFunctions(contractNode);

  // Resolve parents via InheritanceSpecifier + BindingGraph
  const parents = getInheritedContracts(unit, contractCursor);

  for (const parent of parents) {
    if (
      parent.node.kind !== "ContractDefinition" &&
      parent.node.kind !== "InterfaceDefinition"
    ) {
      continue;
    }

    const parentInfo = buildContractInfo(
      unit,
      parent.cursor,
      parent.fileId,
      seen
    );

    if (parentInfo !== null) {
      info.parents.push(parentInfo);
    }
  }

  return info;
}

/**
 * Extract FunctionInfo[] from a contract/interface CST node using AST wrappers.
 */
function extractFunctions(contractNode: NonterminalNode): FunctionInfo[] {
  const {
    ContractDefinition,
    InterfaceDefinition,
    FunctionDefinition,
    ReceiveFunctionDefinition,
    FallbackFunctionDefinition,
    UnnamedFunctionDefinition,
  } = slangAst!;

  const functions: FunctionInfo[] = [];

  let memberItems;
  if (contractNode.kind === "ContractDefinition") {
    memberItems = new ContractDefinition(contractNode).members.items;
  } else if (contractNode.kind === "InterfaceDefinition") {
    memberItems = new InterfaceDefinition(contractNode).members.items;
  } else {
    return functions;
  }

  for (const member of memberItems) {
    const variant = member.variant;
    const kind = variant.cst.kind;

    if (kind === "FunctionDefinition") {
      const funcDef = new FunctionDefinition(
        variant.cst
      ) as unknown as FunctionDefAst;
      functions.push(extractFunctionDefInfo(funcDef));
    } else if (kind === "ReceiveFunctionDefinition") {
      const recvDef = new ReceiveFunctionDefinition(
        variant.cst
      ) as unknown as SpecialFunctionAst;
      functions.push(extractSpecialFunctionInfo(recvDef, "receive"));
    } else if (kind === "FallbackFunctionDefinition") {
      const fbDef = new FallbackFunctionDefinition(
        variant.cst
      ) as unknown as SpecialFunctionAst;
      functions.push(extractSpecialFunctionInfo(fbDef, "fallback"));
    } else if (kind === "UnnamedFunctionDefinition") {
      const unDef = new UnnamedFunctionDefinition(
        variant.cst
      ) as unknown as SpecialFunctionAst;
      functions.push(extractSpecialFunctionInfo(unDef, "fallback"));
    }
  }

  return functions;
}

/**
 * Extract FunctionInfo from a FunctionDefinition AST wrapper.
 */
// AST shapes we operate on. Definitions are intentionally permissive —
// dynamic-imported Slang types vary between FunctionDefinition,
// ReceiveFunctionDefinition, FallbackFunctionDefinition, etc., and the
// fields/methods we read are common across all of them.
interface AstFunctionBodyVariant {
  cst?: unknown;
  isTerminalNode?: () => boolean;
}
interface AttributeItem {
  variant: {
    isTerminalNode?: () => boolean;
    kind?: string;
  };
}
interface FunctionDefAst {
  name: { variant: { unparse: () => string } };
  parameters: {
    cst: { unparse: () => string };
    parameters: {
      items: ReadonlyArray<{ typeName: { cst: { unparse: () => string } } }>;
    };
  };
  returns?: { cst: { unparse: () => string } };
  body: { variant: AstFunctionBodyVariant };
  attributes: { items: readonly AttributeItem[] };
}

function extractFunctionDefInfo(funcDef: FunctionDefAst): FunctionInfo {
  const name = funcDef.name.variant.unparse();

  const paramTypeTexts = funcDef.parameters.parameters.items.map((p) =>
    p.typeName.cst.unparse().replace(/\s+/g, " ").trim()
  );

  const attrs = extractFunctionAttributes(funcDef.attributes.items);

  const returnsDecl = funcDef.returns;
  const returnsText =
    returnsDecl !== undefined
      ? returnsDecl.cst.unparse().replace(/\s+/g, " ").trim()
      : null;

  // FunctionBody.variant is Block (wrapper with .cst) or TerminalNode (semicolon = abstract)
  const hasBody = "cst" in funcDef.body.variant;

  const paramListText = funcDef.parameters.cst
    .unparse()
    .replace(/\s+/g, " ")
    .trim();

  return {
    name,
    paramTypeTexts,
    paramListText,
    visibility: attrs.visibility,
    mutability: attrs.mutability,
    hasBody,
    returnsText,
    isVirtual: attrs.isVirtual,
  };
}

/**
 * Extract FunctionInfo from a special function (receive/fallback/unnamed).
 */
// Receive/fallback/unnamed AST nodes all expose optional attributes/body.
interface SpecialFunctionAst {
  attributes?: { items: readonly AttributeItem[] };
  body?: { variant: AstFunctionBodyVariant };
}

function extractSpecialFunctionInfo(
  funcDef: SpecialFunctionAst,
  _type: "receive" | "fallback"
): FunctionInfo {
  let visibility: string | null = null;
  let mutability: string | null = null;
  let isVirtual = false;
  let hasBody = false;

  // Extract attributes — different attribute types for different function kinds
  const attrItems = funcDef.attributes?.items;
  if (attrItems !== undefined) {
    const attrs = extractFunctionAttributes(attrItems);
    visibility = attrs.visibility;
    mutability = attrs.mutability;
    isVirtual = attrs.isVirtual;
  }

  // Check for body — receive/fallback/unnamed all have .body of type FunctionBody
  if (funcDef.body !== undefined) {
    hasBody = "cst" in funcDef.body.variant;
  }

  return {
    name: null,
    paramTypeTexts: [],
    paramListText: "()",
    visibility,
    mutability,
    hasBody,
    returnsText: null,
    isVirtual,
  };
}

/**
 * Extract visibility, mutability, virtual from FunctionAttribute items.
 */
function extractFunctionAttributes(attrItems: readonly AttributeItem[]): {
  visibility: string | null;
  mutability: string | null;
  isVirtual: boolean;
} {
  let visibility: string | null = null;
  let mutability: string | null = null;
  let isVirtual = false;

  for (const attr of attrItems) {
    // variant is TerminalNode directly for keywords, or a wrapper (ModifierInvocation/OverrideSpecifier) with .cst
    const variant = attr.variant;

    if (
      typeof variant.isTerminalNode === "function" &&
      variant.isTerminalNode()
    ) {
      switch (variant.kind) {
        case "PublicKeyword":
          visibility = "public";
          break;
        case "ExternalKeyword":
          visibility = "external";
          break;
        case "InternalKeyword":
          visibility = "internal";
          break;
        case "PrivateKeyword":
          visibility = "private";
          break;
        case "ViewKeyword":
          mutability = "view";
          break;
        case "PureKeyword":
          mutability = "pure";
          break;
        case "PayableKeyword":
          mutability = "payable";
          break;
        case "VirtualKeyword":
          isVirtual = true;
          break;
      }
    }
  }

  return { visibility, mutability, isVirtual };
}

/**
 * Get the content range of a CST node, excluding leading/trailing trivia.
 * Returns [start, end) byte offsets where start is the first keyword/identifier
 * and end is after the last closing brace.
 */
function getContentRange(cursor: Cursor): [number, number] {
  const c = cursor.clone();
  let firstTokenStart: number | undefined;
  let lastTokenEnd: number | undefined;

  if (!c.goToFirstChild()) {
    const nodeRange = cursor.textRange;
    return [nodeRange.start.utf8, nodeRange.end.utf8];
  }

  do {
    if (c.node.isTerminalNode()) {
      const text = c.node.unparse().trim();

      if (text.length > 0) {
        const tokenRange = c.textRange;

        if (firstTokenStart === undefined) {
          firstTokenStart = tokenRange.start.utf8;
        }

        lastTokenEnd = tokenRange.end.utf8;
      }
    } else {
      // Check if it has non-trivia content by looking at unparse
      const text = c.node.unparse().trim();

      if (text.length > 0) {
        const innerRange = getContentRange(c);

        if (firstTokenStart === undefined) {
          firstTokenStart = innerRange[0];
        }

        lastTokenEnd = innerRange[1];
      }
    }
  } while (c.goToNextSibling());

  if (firstTokenStart !== undefined && lastTokenEnd !== undefined) {
    return [firstTokenStart, lastTokenEnd];
  }

  const fallback = cursor.textRange;
  return [fallback.start.utf8, fallback.end.utf8];
}
