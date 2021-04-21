import { FunctionDefinition } from "@solidity-parser/parser/dist/ast-types";

import { Location, FinderType, Node } from "./Node";

export class FunctionDefinitionNode implements Node {
    type: string;
    uri: string;
    astNode: FunctionDefinition;

    nameLoc?: Location | undefined;

    parent?: Node | undefined;
    children: Node[] = [];

    constructor (functionDefinition: FunctionDefinition, uri: string) {
        this.type = functionDefinition.type;
        this.uri = uri;
        this.astNode = functionDefinition;
        
        if (functionDefinition.loc && functionDefinition.name) {
            this.nameLoc = {
                start: {
                    line: functionDefinition.loc.start.line,
                    column: functionDefinition.loc.start.column + "function ".length
                },
                end: {
                    line: functionDefinition.loc.start.line,
                    column: functionDefinition.loc.start.column + "function ".length + functionDefinition.name.length
                }
            };
        }
    }

    getName(): string | undefined {
        return undefined;
    }

    addChild(child: Node): void {
        this.children.push(child);
    }

    setParent(parent: Node): void {
        this.parent = parent;
    }

    accept(find: FinderType, orphanNodes: Node[], parent?: Node): void {
        if (parent) {
            this.setParent(parent);
        }

        for (const param of this.astNode.parameters) {
            find(param, this.uri).accept(find, orphanNodes, this);
        }

        if (this.astNode.returnParameters) {
            for (const returnParam of this.astNode.returnParameters) {
                find(returnParam, this.uri).accept(find, orphanNodes, this);
            }
        }

        if (this.astNode.body) {
            find(this.astNode.body, this.uri).accept(find, orphanNodes, this);
        }

        parent?.addChild(this);
    }
}
