import {
  VSCodePosition,
  CompletionList,
  CompletionItem,
  CompletionItemKind,
  MarkupKind,
  ISolFileEntry,
  Node,
  TypeName,
  ContractDefinitionNode,
  VariableDeclaration,
  FileLevelConstant,
  Position,
  expressionNodeTypes,
} from "@common/types";
import { getParserPositionFromVSCodePosition } from "@common/utils";
import { globalVariables, defaultCompletion } from "./defaultCompletion";
import { Logger } from "@utils/Logger";
import { isImportDirectiveNode } from "@analyzer/utils/typeGuards";
import { CompletionContext } from "vscode-languageserver/node";
import { getImportPathCompletion } from "./getImportPathCompletion";
import { TextDocument } from "@common/types";
import { applyEditToDocumentAnalyzer } from "@utils/applyEditToDocumentAnalyzer";
import { CompletionParams } from "vscode-languageserver/node";
import { ServerState } from "../../types";
import { ProjectContext } from "./types";
import { findProjectFor } from "@utils/findProjectFor";
import { decodeUriAndRemoveFilePrefix } from "@utils/index";
import { arrayCompletions } from "./arrayCompletions";

export const onCompletion = (serverState: ServerState) => {
  return (params: CompletionParams): CompletionList | undefined => {
    const { logger } = serverState;

    logger.trace("onCompletion");

    try {
      return serverState.telemetry.trackTimingSync("onCompletion", () => {
        const { found, errorMessage, documentAnalyzer, document } =
          applyEditToDocumentAnalyzer(
            serverState,
            params.textDocument.uri,
            (document) => resolveChangedDocText(params, document)
          );

        if (!found || !documentAnalyzer || !document) {
          logger.error(
            new Error(
              `Error editing and analyzing doc within onCompletion: ${errorMessage}`
            )
          );

          return undefined;
        }

        const project = findProjectFor(
          serverState,
          decodeUriAndRemoveFilePrefix(document.uri)
        );

        const projCtx: ProjectContext = {
          project,
          solFileIndex: serverState.solFileIndex,
        };

        return doComplete(
          documentAnalyzer,
          params.position,
          params.context,
          projCtx,
          logger
        );
      });
    } catch (err) {
      logger.error(err);
    }
  };
};

function resolveChangedDocText(
  params: CompletionParams,
  document: TextDocument
) {
  const documentText = document.getText();
  let newDocumentText = documentText;

  // Hack if triggerCharacter was "." then we insert ";" because the tolerance mode @solidity-parser/parser crashes as we type.
  // This only happens if there is no ";" at the end of the line.
  if (params.context?.triggerCharacter === ".") {
    const cursorOffset = document.offsetAt(params.position);

    const eofOffset =
      documentText.indexOf("\n", cursorOffset) > cursorOffset
        ? documentText.indexOf("\n", cursorOffset)
        : cursorOffset;

    newDocumentText =
      documentText.slice(0, cursorOffset) +
      "_;" +
      documentText.slice(cursorOffset, eofOffset) +
      ";";
  }

  return newDocumentText;
}

export function doComplete(
  documentAnalyzer: ISolFileEntry,
  position: VSCodePosition,
  context: CompletionContext | undefined,
  projCtx: ProjectContext,
  logger: Logger
): CompletionList | undefined {
  const result: CompletionList = { isIncomplete: false, items: [] };

  if (!documentAnalyzer.analyzerTree.tree) {
    return result;
  }

  let definitionNode = documentAnalyzer.searcher.findNodeByPosition(
    documentAnalyzer.uri,
    getParserPositionFromVSCodePosition(position),
    documentAnalyzer.analyzerTree.tree,
    true
  );

  // Check if the definitionNode exists and if not, we will check if maybe Node exists in orphan Nodes.
  // This is important for "this", "super" and global variables because they exist only in orphanNodes.
  if (!definitionNode) {
    const newPosition = {
      line: position.line + 1,
      column: position.character - 1, // -1 because we want to get the element before "."
    };

    for (const orphanNode of documentAnalyzer.orphanNodes) {
      if (isNodePosition(orphanNode, newPosition)) {
        definitionNode = orphanNode;
        break;
      }
    }
  }

  if (
    context?.triggerCharacter === '"' &&
    (!definitionNode || !isImportDirectiveNode(definitionNode))
  ) {
    return undefined;
  }

  const definitionNodeName = definitionNode?.getName();
  if (definitionNodeName === "this") {
    result.items = getThisCompletions(documentAnalyzer, position);
  } else if (definitionNodeName === "super") {
    result.items = getSuperCompletions(documentAnalyzer, position);
  } else if (
    definitionNodeName &&
    Object.keys(globalVariables).includes(definitionNodeName)
  ) {
    result.items = getGlobalVariableCompletions(definitionNodeName);
  } else if (definitionNode && isImportDirectiveNode(definitionNode)) {
    result.items = getImportPathCompletion(position, definitionNode, projCtx, {
      logger,
    });
  } else if (
    definitionNode &&
    expressionNodeTypes.includes(definitionNode.getExpressionNode()?.type || "")
  ) {
    result.items = getMemberAccessCompletions(
      documentAnalyzer,
      position,
      definitionNode
    );
  } else {
    result.items = getDefaultCompletions(documentAnalyzer, position);
  }

  return result;
}

function getThisCompletions(
  documentAnalyzer: ISolFileEntry,
  position: VSCodePosition
): CompletionItem[] {
  const definitionNodes: Node[] = [];
  const cursorPosition = getParserPositionFromVSCodePosition(position);

  const contractDefinitionNode = findContractDefinition(
    documentAnalyzer.analyzerTree.tree,
    cursorPosition
  );

  const inheritanceDefinitionNodes: Node[] =
    documentAnalyzer.searcher.findInheritanceDefinitionNodes(
      documentAnalyzer.uri,
      getParserPositionFromVSCodePosition(position),
      contractDefinitionNode
    );

  for (const definitionNode of inheritanceDefinitionNodes.concat(
    contractDefinitionNode?.children || []
  )) {
    if (definitionNode.type === "FunctionDefinition") {
      definitionNodes.push(definitionNode);
    }
  }

  return getCompletionsFromNodes(definitionNodes);
}

function getSuperCompletions(
  documentAnalyzer: ISolFileEntry,
  position: VSCodePosition
): CompletionItem[] {
  const definitionNodes: Node[] = [];
  const cursorPosition = getParserPositionFromVSCodePosition(position);

  const contractDefinitionNode = findContractDefinition(
    documentAnalyzer.analyzerTree.tree,
    cursorPosition
  );

  for (const inheritanceNode of contractDefinitionNode?.getInheritanceNodes() ||
    []) {
    for (const definitionNode of inheritanceNode.children) {
      const visibility =
        documentAnalyzer.searcher.getNodeVisibility(definitionNode);

      if (
        visibility !== "private" &&
        contractDefinitionNode?.getName() !== definitionNode.getName()
      ) {
        definitionNodes.push(definitionNode);
      }
    }
  }

  return getCompletionsFromNodes(definitionNodes);
}

function getGlobalVariableCompletions(
  globalVariable: string
): CompletionItem[] {
  const globalVariableFunctions = globalVariables[globalVariable];

  if (globalVariableFunctions) {
    return globalVariableFunctions.map((globalVariableFunction: string) => {
      return {
        label: globalVariableFunction,
        kind: CompletionItemKind.Function,
      };
    });
  }

  return [];
}

function getMemberAccessCompletions(
  documentAnalyzer: ISolFileEntry,
  position: VSCodePosition,
  node: Node
): CompletionItem[] {
  if (isArrayAccess(node)) {
    return arrayCompletions;
  }

  const definitionNodes: Node[] = [];
  const cursorPosition = getParserPositionFromVSCodePosition(position);

  for (const definitionType of node.getTypeNodes()) {
    for (const definitionNode of definitionType.children) {
      if (definitionType.uri === definitionNode.uri) {
        const isVisible = documentAnalyzer.searcher.checkIsNodeVisible(
          documentAnalyzer.uri,
          cursorPosition,
          definitionNode
        );

        if (
          isVisible &&
          definitionNode.getName() !== definitionType.getName()
        ) {
          definitionNodes.push(definitionNode);
        }
      }
    }
  }

  return getCompletionsFromNodes(definitionNodes);
}

function isArrayAccess(node: Node): boolean {
  const definition = node.getDefinitionNode();

  if (definition?.type !== "VariableDeclaration") {
    return false;
  }

  return definition.typeNodes.some((tn) => tn.type === "ArrayTypeName");
}

function getDefaultCompletions(
  documentAnalyzer: ISolFileEntry,
  position: VSCodePosition
): CompletionItem[] {
  const definitionNodes: Node[] = documentAnalyzer.searcher.findDefinitionNodes(
    documentAnalyzer.uri,
    getParserPositionFromVSCodePosition(position),
    documentAnalyzer.analyzerTree.tree
  );

  return [...getCompletionsFromNodes(definitionNodes), ...defaultCompletion];
}

function getCompletionsFromNodes(nodes: Node[]): CompletionItem[] {
  const completions: CompletionItem[] = [];
  let typeNode: TypeName | null;
  let item: CompletionItem;
  let contractDefinitionNode: ContractDefinitionNode;

  for (let node of nodes) {
    const name = node.getName();

    if (
      name &&
      !completions.filter((completion) => completion.label === name)[0]
    ) {
      if (node.type === "Identifier") {
        const nodeTmp = node.getDefinitionNode();
        node = nodeTmp ? nodeTmp : node;
      }

      switch (node.type) {
        case "ContractDefinition":
          contractDefinitionNode = node as ContractDefinitionNode;

          switch (contractDefinitionNode.getKind()) {
            case "interface":
              item = {
                label: name,
                kind: CompletionItemKind.Interface,
                documentation: {
                  kind: MarkupKind.Markdown,
                  value: `${contractDefinitionNode.getKind()} ${name}`,
                },
              };
              break;

            default:
              item = {
                label: name,
                kind: CompletionItemKind.Class,
                documentation: {
                  kind: MarkupKind.Markdown,
                  value: `${contractDefinitionNode.getKind()} ${name}`,
                },
              };
              break;
          }
          break;

        case "StructDefinition":
          item = {
            label: name,
            kind: CompletionItemKind.Struct,
            documentation: {
              kind: MarkupKind.Markdown,
              value: `struct ${name}`,
            },
          };
          break;

        case "EnumDefinition":
          item = {
            label: name,
            kind: CompletionItemKind.Enum,
            documentation: {
              kind: MarkupKind.Markdown,
              value: `enum ${name}`,
            },
          };
          break;

        case "EnumValue":
          item = {
            label: name,
            kind: CompletionItemKind.EnumMember,
            documentation: {
              kind: MarkupKind.Markdown,
              value: `enum member ${name}`,
            },
          };
          break;

        case "EventDefinition":
          item = {
            label: name,
            kind: CompletionItemKind.Event,
            documentation: {
              kind: MarkupKind.Markdown,
              value: `event ${name}`,
            },
          };
          break;

        case "VariableDeclaration":
          typeNode = (node.astNode as VariableDeclaration).typeName;

          item = {
            label: name,
            kind: CompletionItemKind.Variable,
            documentation: {
              kind: MarkupKind.Markdown,
              value: `*(variable)* ${getTypeName(typeNode)} ${name}`,
            },
          };
          break;

        case "FileLevelConstant":
          typeNode = (node.astNode as FileLevelConstant).typeName;

          item = {
            label: name,
            kind: CompletionItemKind.Constant,
            documentation: {
              kind: MarkupKind.Markdown,
              value: `*(constant)* ${getTypeName(typeNode)} ${name}`,
            },
          };
          break;

        case "AssemblyLocalDefinition":
          item = {
            label: name,
            kind: CompletionItemKind.Variable,
            documentation: {
              kind: MarkupKind.Markdown,
              value: `*(assembly variable)* ${name}`,
            },
          };
          break;

        default:
          item = {
            label: name,
            kind: CompletionItemKind.Function,
          };
          break;
      }

      completions.push(item);
    }
  }

  return completions;
}

function getTypeName(typeNode: TypeName | null): string {
  switch (typeNode?.type) {
    case "ElementaryTypeName":
      return typeNode.name;

    case "UserDefinedTypeName":
      return typeNode.namePath;

    case "Mapping":
      return `mapping(${
        typeNode.keyType.type === "ElementaryTypeName"
          ? typeNode.keyType.name
          : typeNode.keyType.namePath
      } => ${getTypeName(typeNode.valueType)})`;

    case "ArrayTypeName":
      return getTypeName(typeNode.baseTypeName);
  }

  return "";
}

function isNodePosition(node: Node, position: Position): boolean {
  if (
    node.nameLoc &&
    node.nameLoc.start.line === position.line &&
    node.nameLoc.end.line === position.line &&
    node.nameLoc.start.column <= position.column &&
    node.nameLoc.end.column >= position.column
  ) {
    return true;
  }

  return false;
}

function findContractDefinition(
  from: Node | undefined,
  position: Position,
  visitedNodes?: Node[]
): ContractDefinitionNode | undefined {
  if (!visitedNodes) {
    visitedNodes = [];
  }

  if (!from) {
    return undefined;
  }

  if (visitedNodes.includes(from)) {
    return undefined;
  }

  // Add as visited node
  visitedNodes.push(from);

  if (
    from.astNode.loc &&
    from.astNode.loc.start.line <= position.line &&
    from.astNode.loc.end.line >= position.line &&
    from.type === "ContractDefinition"
  ) {
    return from as ContractDefinitionNode;
  }

  let contractDefinitionNode: Node | undefined;
  for (const child of from.children) {
    contractDefinitionNode = findContractDefinition(
      child,
      position,
      visitedNodes
    );

    if (contractDefinitionNode) {
      return contractDefinitionNode as ContractDefinitionNode;
    }
  }
}
