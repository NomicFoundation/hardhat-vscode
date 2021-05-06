import { MemberAccess } from "@solidity-parser/parser/dist/src/ast-types";

import { Location, FinderType, Node, Position } from "./Node";

export class MemberAccessNode implements Node {
    type: string;
    uri: string;
    astNode: MemberAccess;

    nameLoc?: Location | undefined;

    parent?: Node | undefined;
    children: Node[] = [];

    typeNodes: Node[] = [];

    constructor (memberAccess: MemberAccess, uri: string) {
        this.type = memberAccess.type;
        this.uri = uri;

        if (memberAccess.loc) {
            // Bug in solidity parser doesn't give exact locations
            memberAccess.loc.start.column = memberAccess.loc.end.column;
            memberAccess.loc.end.column = memberAccess.loc.end.column + memberAccess.memberName.length;

            this.nameLoc = JSON.parse(JSON.stringify(memberAccess.loc));
        }

        this.astNode = memberAccess;
    }

    getTypeNodes(): Node[] {
        return this.typeNodes;
    }

    getName(): string | undefined {
        return this.astNode.memberName;
    }

    addChild(child: Node): void {
        this.children.push(child);
    }

    setParent(parent: Node): void {
        this.parent = parent;
    }

    accept(find: FinderType, orphanNodes: Node[], parent?: Node): Node {
        // TO-DO: Improve logic for deeper member access
        const expressionNode = find(this.astNode.expression, this.uri).accept(find, orphanNodes, parent);

        const expressionTypeNodes = expressionNode.getTypeNodes();

        if (expressionTypeNodes.length === 1) {
            for (const definitionType of expressionTypeNodes[0].getTypeNodes()) {
                for (const definitionChild of definitionType.children) {
                    if (definitionChild.getName() && definitionChild.getName() === this.getName()) {
                        this.setParent(definitionChild);
                        definitionChild?.addChild(this);

                        this.typeNodes.push(definitionChild);
    
                        return this;
                    }
                }
            }
        }

        orphanNodes.push(this);

        return this;
    }

    getDefinitionNode(): Node {
        // TO-DO: Method not implemented
        return this;
    }
}
