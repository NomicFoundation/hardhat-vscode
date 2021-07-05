import * as finder from "@common/finder";
import { AssemblyCall, FinderType, Node } from "@common/types";

export class AssemblyCallNode extends Node {
    astNode: AssemblyCall;

    constructor (assemblyCall: AssemblyCall, uri: string, rootPath: string) {
        super(assemblyCall, uri, rootPath);

        if (assemblyCall.loc) {
            // Bug in solidity parser doesn't give exact end location
            assemblyCall.loc.end.column = assemblyCall.loc.end.column + assemblyCall.functionName.length;

            this.nameLoc = JSON.parse(JSON.stringify(assemblyCall.loc));
        }

        this.astNode = assemblyCall;
    }

    getName(): string | undefined {
        return this.astNode.functionName;
    }

    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node {
        this.setExpressionNode(expression);

        for (const argument of this.astNode.arguments || []) {
            find(argument, this.uri, this.rootPath).accept(find, orphanNodes, parent);
        }

        if (parent) {
            const assemblyCallParent = finder.findParent(this, parent);

            if (assemblyCallParent) {
                this.addTypeNode(assemblyCallParent);

                this.setParent(assemblyCallParent);
                assemblyCallParent?.addChild(this);

                return this;
            }
        }

        orphanNodes.push(this);

        return this;
    }
}
