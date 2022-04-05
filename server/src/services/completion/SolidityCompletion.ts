import * as fs from "fs";
import * as path from "path";
import { Analyzer } from "@analyzer/index";
import { getParserPositionFromVSCodePosition } from "@common/utils";
import {
  VSCodePosition,
  CompletionList,
  CompletionItem,
  CompletionItemKind,
  MarkupKind,
  DocumentAnalyzer,
  Node,
  TypeName,
  ContractDefinitionNode,
  VariableDeclaration,
  FileLevelConstant,
  Position,
  expressionNodeTypes,
} from "@common/types";
import { globalVariables, defaultCompletion } from "./defaultCompletion";
import { Logger } from "@utils/Logger";
import { isImportDirectiveNode } from "@analyzer/utils/typeGuards";
import { CompletionContext } from "vscode-languageserver/node";
import { getImportPathCompletion } from "./getImportPathCompletion";

export class SolidityCompletion {
  analyzer: Analyzer;

  constructor(analyzer: Analyzer) {
    this.analyzer = analyzer;
  }

  public doComplete(
    position: VSCodePosition,
    documentAnalyzer: DocumentAnalyzer,
    context: CompletionContext | undefined,
    logger: Logger
  ): CompletionList | undefined {
    const analyzerTree = documentAnalyzer.analyzerTree.tree;
    const result: CompletionList = { isIncomplete: false, items: [] };

    if (!analyzerTree) {
      return result;
    }

    let definitionNode = this.findNodeByPosition(
      documentAnalyzer.uri,
      position,
      analyzerTree
    );

    // Check if the definitionNode exists and if not, we will check if maybe Node exists in orphan Nodes.
    // This is important for "this", "super" and global variables because they exist only in orphanNodes.
    if (!definitionNode) {
      const newPosition = {
        line: position.line + 1,
        column: position.character - 1, // -1 because we want to get the element before "."
      };

      for (const orphanNode of documentAnalyzer.orphanNodes) {
        if (this.isNodePosition(orphanNode, newPosition)) {
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
      result.items = this.getThisCompletions(documentAnalyzer, position);
    } else if (definitionNodeName === "super") {
      result.items = this.getSuperCompletions(documentAnalyzer, position);
    } else if (
      definitionNodeName &&
      Object.keys(globalVariables).includes(definitionNodeName)
    ) {
      result.items = this.getGlobalVariableCompletions(definitionNodeName);
    } else if (definitionNode && isImportDirectiveNode(definitionNode)) {
      result.items = getImportPathCompletion(position, definitionNode, {
        analyzer: this.analyzer,
        logger,
      });
    } else if (
      definitionNode &&
      expressionNodeTypes.includes(
        definitionNode.getExpressionNode()?.type || ""
      )
    ) {
      result.items = this.getMemberAccessCompletions(
        documentAnalyzer.uri,
        position,
        definitionNode
      );
    } else {
      result.items = this.getDefaultCompletions(
        documentAnalyzer.uri,
        position,
        analyzerTree
      );
    }

    return result;
  }

  private getThisCompletions(
    documentAnalyzer: DocumentAnalyzer,
    position: VSCodePosition
  ): CompletionItem[] {
    const definitionNodes: Node[] = [];
    const cursorPosition = getParserPositionFromVSCodePosition(position);

    const contractDefinitionNode = this.findContractDefinition(
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

    return this.getCompletionsFromNodes(definitionNodes);
  }

  private getSuperCompletions(
    documentAnalyzer: DocumentAnalyzer,
    position: VSCodePosition
  ): CompletionItem[] {
    const definitionNodes: Node[] = [];
    const cursorPosition = getParserPositionFromVSCodePosition(position);

    const contractDefinitionNode = this.findContractDefinition(
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

    return this.getCompletionsFromNodes(definitionNodes);
  }

  private getGlobalVariableCompletions(
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

  private getMemberAccessCompletions(
    uri: string,
    position: VSCodePosition,
    node: Node
  ): CompletionItem[] {
    const definitionNodes: Node[] = [];
    const documentAnalyzer = this.analyzer.getDocumentAnalyzer(uri);
    const cursorPosition = getParserPositionFromVSCodePosition(position);

    for (const definitionType of node.getTypeNodes()) {
      for (const definitionNode of definitionType.children) {
        if (definitionType.uri === definitionNode.uri) {
          const isVisible = documentAnalyzer.searcher.checkIsNodeVisible(
            uri,
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

    return this.getCompletionsFromNodes(definitionNodes);
  }

  private getDefaultCompletions(
    uri: string,
    position: VSCodePosition,
    analyzerTree: Node
  ): CompletionItem[] {
    const documentAnalyzer = this.analyzer.getDocumentAnalyzer(uri);

    const definitionNodes: Node[] =
      documentAnalyzer.searcher.findDefinitionNodes(
        uri,
        getParserPositionFromVSCodePosition(position),
        analyzerTree
      );

    return [
      ...this.getCompletionsFromNodes(definitionNodes),
      ...defaultCompletion,
    ];
  }

  private getCompletionsFromFiles(
    currentImport: string,
    importPath: string,
    files: string[],
    logger: Logger
  ): CompletionItem[] {
    const prefixes = this.resolveImportPrefixes(currentImport);

    return files
      .map((file) => {
        return this.convertFileToCompletion(
          file,
          { ...prefixes, importPath },
          logger
        );
      })
      .filter((x): x is CompletionItem => x !== null);
  }

  private resolveImportPrefixes(currentImport: string) {
    let prefix = "";
    let displayPrefix = "";

    switch (currentImport) {
      case "":
        prefix = "./";
        displayPrefix = "./";
        break;
      case ".":
        prefix = "/";
        displayPrefix = "./";
        break;
      case "./":
        prefix = "";
        displayPrefix = "./";
        break;
      case "..":
        prefix = "/";
        displayPrefix = "../";
        break;
      case "../":
        prefix = "";
        displayPrefix = "../";
        break;
      default:
        prefix = currentImport.endsWith("..") ? "/" : "";
        break;
    }

    return { prefix, displayPrefix };
  }

  private convertFileToCompletion(
    file: string,
    {
      importPath,
      displayPrefix,
      prefix,
    }: { importPath: string; displayPrefix: string; prefix: string },
    logger: Logger
  ) {
    try {
      const absolutePath = path.join(importPath, file);
      const fileStat = fs.lstatSync(absolutePath);

      const label = `${displayPrefix}${file}`;
      const insertText = `${prefix}${file}`;

      if (fileStat.isFile() && file.slice(-4) === ".sol") {
        const completionItem: CompletionItem = {
          label,
          insertText,
          kind: CompletionItemKind.File,
          documentation: "Imports the package",
        };

        return completionItem;
      } else if (fileStat.isDirectory() && file !== "node_modules") {
        const completionItem: CompletionItem = {
          label,
          insertText,
          kind: CompletionItemKind.Folder,
          documentation: "Imports the package",
        };

        return completionItem;
      }

      return null;
    } catch (err) {
      logger.error(err);
      return null;
    }
  }

  private getCompletionsFromNodes(nodes: Node[]): CompletionItem[] {
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
                value: `*(variable)* ${this.getTypeName(typeNode)} ${name}`,
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
                value: `*(constant)* ${this.getTypeName(typeNode)} ${name}`,
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

  private getTypeName(typeNode: TypeName | null): string {
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
        } => ${this.getTypeName(typeNode.valueType)})`;

      case "ArrayTypeName":
        return this.getTypeName(typeNode.baseTypeName);
    }

    return "";
  }

  private findNodeByPosition(
    uri: string,
    position: VSCodePosition,
    analyzerTree: Node
  ): Node | undefined {
    const documentAnalyzer = this.analyzer.getDocumentAnalyzer(uri);

    return documentAnalyzer.searcher.findNodeByPosition(
      uri,
      getParserPositionFromVSCodePosition(position),
      analyzerTree,
      true
    );
  }

  private isNodePosition(node: Node, position: Position): boolean {
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

  private findContractDefinition(
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
      contractDefinitionNode = this.findContractDefinition(
        child,
        position,
        visitedNodes
      );

      if (contractDefinitionNode) {
        return contractDefinitionNode as ContractDefinitionNode;
      }
    }
  }
}
