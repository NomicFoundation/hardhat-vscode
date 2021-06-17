import * as finder from "@common/finder";
import { UserDefinedTypeName, FinderType, Node } from "@common/types";

export class UserDefinedTypeNameNode extends Node {
    astNode: UserDefinedTypeName;

    constructor (userDefinedTypeName: UserDefinedTypeName, uri: string) {
        super(userDefinedTypeName, uri);

        if (userDefinedTypeName.loc) {
            // Bug in solidity parser doesn't give exact end location
            userDefinedTypeName.loc.end.column = userDefinedTypeName.loc.end.column + userDefinedTypeName.namePath.length;

            this.nameLoc = JSON.parse(JSON.stringify(userDefinedTypeName.loc));
        }

        this.astNode = userDefinedTypeName;
    }

    getName(): string | undefined {
        return this.astNode.namePath;
    }

    setParent(parent: Node | undefined): void {
        this.parent = parent;

        const declarationNode = this.getDeclarationNode();

        for (const child of declarationNode?.children || []) {
            const expressionNode = child.getExpressionNode();

            if (parent && expressionNode && expressionNode.type === "MemberAccess") {
                const definitionTypes = parent.getTypeNodes();
    
                this.findMemberAccessParent(expressionNode, definitionTypes);
            }
        }
    }

    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node {
        this.setExpressionNode(expression);

        if (parent) {
            const definitionParent = finder.findParent(this, parent);

            if (definitionParent) {
                this.addTypeNode(definitionParent);

                this.setParent(definitionParent);
                definitionParent?.addChild(this);

                return this;
            }
        }

        orphanNodes.push(this);

        return this;
    }

    findMemberAccessParent(expressionNode: Node, definitionTypes: Node[]): void {
        for (const definitionType of definitionTypes) {
            for (const definitionChild of definitionType.children) {
                if (finder.isNodeConnectable(definitionChild, expressionNode)) {
                    expressionNode.addTypeNode(definitionChild);

                    expressionNode.setParent(definitionChild);
                    definitionChild?.addChild(expressionNode);

                    // If the parent uri and node uri are not the same, add the node to the exportNode field
                    if (definitionChild && definitionChild.uri !== expressionNode.uri) {
                        const exportRootNode = finder.findSourceUnitNode(definitionChild);
                        const importRootNode = finder.findSourceUnitNode(finder.analyzerTree);

                        if (exportRootNode) {
                            exportRootNode.addExportNode(expressionNode);
                        }

                        if (importRootNode) {
                            importRootNode.addImportNode(expressionNode);
                        }
                    }

                    return;
                }
            }
        }
    }
}
