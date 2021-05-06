import { FunctionDefinition } from "@solidity-parser/parser/dist/src/ast-types";

import { Location, FinderType, Node, Position } from "./Node";

export class FunctionDefinitionNode implements Node {
    type: string;
    uri: string;
    astNode: FunctionDefinition;

    nameLoc?: Location | undefined;

    parent?: Node | undefined;
    children: Node[] = [];

    typeNodes: Node[] = [];

    constructor (functionDefinition: FunctionDefinition, uri: string) {
        this.type = functionDefinition.type;
        this.uri = uri;
        this.astNode = functionDefinition;
        
        if (!functionDefinition.isConstructor && functionDefinition.loc && functionDefinition.name) {
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

    getTypeNodes(): Node[] {
        let nodes: Node[] = [];

        this.typeNodes.forEach(typeNode => {
            nodes = nodes.concat(typeNode.getTypeNodes());
        });

        return nodes;
    }

    getName(): string | undefined {
        return this.astNode.name || undefined;
    }

    addChild(child: Node): void {
        this.children.push(child);
    }

    setParent(parent: Node): void {
        this.parent = parent;
    }

    accept(find: FinderType, orphanNodes: Node[], parent?: Node): Node {
        if (parent) {
            this.setParent(parent);
        }

        for (const param of this.astNode.parameters) {
            find(param, this.uri).accept(find, orphanNodes, this);
        }

        if (this.astNode.returnParameters) {
            for (const returnParam of this.astNode.returnParameters) {
                const typeNode = find(returnParam, this.uri).accept(find, orphanNodes, this);

                this.typeNodes.push(typeNode);
            }
        }

        if (this.astNode.body) {
            find(this.astNode.body, this.uri).accept(find, orphanNodes, this);
        }

        parent?.addChild(this);

        return this;
    }

    getDefinitionNode(): Node {
        // TO-DO: Method not implemented
        return this;
    }
}
