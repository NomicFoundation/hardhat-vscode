import * as finder from "@common/finder";
import { UsingForDeclaration, FinderType, Node } from "@common/types";

export class UsingForDeclarationNode extends Node {
    astNode: UsingForDeclaration;

    connectionTypeRules: string[] = [ "ContractDefinition" ];

    constructor (usingForDeclaration: UsingForDeclaration, uri: string, rootPath: string) {
        super(usingForDeclaration, uri, rootPath);
        this.astNode = usingForDeclaration;

        if (usingForDeclaration.loc && usingForDeclaration.libraryName) {
            this.nameLoc = {
                start: {
                    line: usingForDeclaration.loc.start.line,
                    column: usingForDeclaration.loc.start.column + "using ".length
                },
                end: {
                    line: usingForDeclaration.loc.start.line,
                    column: usingForDeclaration.loc.start.column + "using ".length + (this.getName()?.length || 0)
                }
            };
        }
    }

    getName(): string | undefined {
        return this.astNode.libraryName;
    }

    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node {
        this.setExpressionNode(expression);

        if (this.astNode.typeName) {
            find(this.astNode.typeName, this.uri, this.rootPath).accept(find, orphanNodes, parent);
        }

        if (parent) {
            const identifierParent = finder.findParent(this, parent);

            if (identifierParent) {
                this.addTypeNode(identifierParent);

                this.setParent(identifierParent);
                identifierParent?.addChild(this);

                return this;
            }
        }

        orphanNodes.push(this);

        return this;
    }
}
