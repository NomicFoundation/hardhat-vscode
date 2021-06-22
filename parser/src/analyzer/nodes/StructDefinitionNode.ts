import * as finder from "@common/finder";
import { findSourceUnitNode } from "@common/utils";
import { StructDefinition, FinderType, Node } from "@common/types";

export class StructDefinitionNode extends Node {
    astNode: StructDefinition;

    connectionTypeRules: string[] = [ "UserDefinedTypeName", "MemberAccess", "FunctionCall" ];

    constructor (structDefinition: StructDefinition, uri: string) {
        super(structDefinition, uri);
        this.astNode = structDefinition;

        if (structDefinition.loc) {
            this.nameLoc = {
                start: {
                    line: structDefinition.loc.start.line,
                    column: structDefinition.loc.start.column + "struct ".length
                },
                end: {
                    line: structDefinition.loc.start.line,
                    column: structDefinition.loc.start.column + "struct ".length + structDefinition.name.length
                }
            };
        }

        this.addTypeNode(this);
    }

    getTypeNodes(): Node[] {
        return this.typeNodes;
    }

    getDefinitionNode(): Node | undefined {
        return this;
    }

    getName(): string | undefined {
        return this.astNode.name;
    }

    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node {
        this.setExpressionNode(expression);

        if (parent) {
            this.setParent(parent);
        }

        for (const member of this.astNode.members) {
            find(member, this.uri).accept(find, orphanNodes, this);
        }

        const rootNode = findSourceUnitNode(parent);
        if (rootNode) {
            const exportNodes = new Array(...rootNode.getExportNodes());
            finder.findChildren(this, exportNodes, false);
        }

        finder.findChildren(this, orphanNodes);

        parent?.addChild(this);

        return this;
    }
}
