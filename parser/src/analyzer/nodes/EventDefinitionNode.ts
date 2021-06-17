import * as finder from "@common/finder";
import { EventDefinition, FinderType, Node } from "@common/types";

export class EventDefinitionNode extends Node {
    astNode: EventDefinition;

    connectionTypeRules: string[] = [ "EmitStatement" ];

    constructor (eventDefinition: EventDefinition, uri: string) {
        super(eventDefinition, uri);
        this.astNode = eventDefinition;

        if (eventDefinition.loc && eventDefinition.name) {
            this.nameLoc = {
                start: {
                    line: eventDefinition.loc.start.line,
                    column: eventDefinition.loc.start.column + "event ".length
                },
                end: {
                    line: eventDefinition.loc.start.line,
                    column: eventDefinition.loc.start.column + "event ".length + (this.getName()?.length || 0)
                }
            };
        }
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

        for (const parameter of this.astNode.parameters) {
            find(parameter, this.uri).accept(find, orphanNodes, parent);
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
