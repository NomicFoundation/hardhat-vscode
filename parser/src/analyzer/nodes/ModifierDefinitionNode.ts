import * as finder from "@common/finder";
import { findSourceUnitNode } from "@common/utils";
import { ModifierDefinition, FinderType, Node } from "@common/types";

export class ModifierDefinitionNode extends Node {
    astNode: ModifierDefinition;

    connectionTypeRules: string[] = [ "ModifierInvocation" ];

    constructor (modifierDefinition: ModifierDefinition, uri: string) {
        super(modifierDefinition, uri);
        this.astNode = modifierDefinition;
        
        if (modifierDefinition.loc) {
            this.nameLoc = {
                start: {
                    line: modifierDefinition.loc.start.line,
                    column: modifierDefinition.loc.start.column + "modifier ".length
                },
                end: {
                    line: modifierDefinition.loc.start.line,
                    column: modifierDefinition.loc.start.column + "modifier ".length + modifierDefinition.name.length
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

        for (const override of this.astNode.override || []) {
            find(override, this.uri).accept(find, orphanNodes, this);
        }

        for (const param of this.astNode.parameters || []) {
            find(param, this.uri).accept(find, orphanNodes, this);
        }

        if (this.astNode.body) {
            find(this.astNode.body, this.uri).accept(find, orphanNodes, this);
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
