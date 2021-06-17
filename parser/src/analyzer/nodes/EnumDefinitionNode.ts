import * as finder from "@common/finder";
import { EnumDefinition, FinderType, Node } from "@common/types";

export class EnumDefinitionNode extends Node {
    astNode: EnumDefinition;

    connectionTypeRules: string[] = [ "Identifier", "UserDefinedTypeName" ];

    constructor (enumDefinition: EnumDefinition, uri: string) {
        super(enumDefinition, uri);
        this.astNode = enumDefinition;

        if (enumDefinition.loc) {
            this.nameLoc = {
                start: {
                    line: enumDefinition.loc.start.line,
                    column: enumDefinition.loc.start.column + "enum ".length
                },
                end: {
                    line: enumDefinition.loc.start.line,
                    column: enumDefinition.loc.start.column + "enum ".length + enumDefinition.name.length
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

        const rootNode = finder.findSourceUnitNode(parent);
        if (rootNode) {
            const exportNodes = new Array(...rootNode.getExportNodes());
            finder.findChildren(this, exportNodes, false);
        }

        finder.findChildren(this, orphanNodes);

        parent?.addChild(this);

        return this;
    }
}
