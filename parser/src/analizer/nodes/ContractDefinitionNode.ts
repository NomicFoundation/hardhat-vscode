import { ContractDefinition } from "@solidity-parser/parser/dist/ast-types";

import { Location, FinderType, Node } from "./Node";

export class ContractDefinitionNode implements Node {
    type: string;
    uri: string;
    astNode: ContractDefinition;

    nameLoc?: Location | undefined;

    parent?: Node | undefined;
    children: Node[] = [];

    constructor (contractDefinition: ContractDefinition, uri: string) {
        this.type = contractDefinition.type;
        this.uri = uri;
        this.astNode = contractDefinition;
        
        if (contractDefinition.loc) {
            this.nameLoc = {
                start: {
                    line: contractDefinition.loc.start.line,
                    column: contractDefinition.loc.start.column + "contract ".length
                },
                end: {
                    line: contractDefinition.loc.start.line,
                    column: contractDefinition.loc.start.column + "contract ".length + contractDefinition.name.length
                }
            };
        }
    }

    addChild(child: Node): void {
        this.children.push(child);
    }

    setParent(parent: Node): void {
        this.parent = parent;
    }

    accept(find: FinderType, orphanNodes: Node[], parent: Node): void {
        this.setParent(parent);

        for (const subNode of this.astNode.subNodes) {
            find(subNode, this.uri).accept(find, orphanNodes, this);
        }

        parent.addChild(this);
    }
}
