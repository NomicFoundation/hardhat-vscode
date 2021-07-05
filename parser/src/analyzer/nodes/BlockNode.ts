import { Block, FinderType, Node } from "@common/types";

export class BlockNode extends Node {
    astNode: Block;

    constructor (block: Block, uri: string, rootPath: string) {
        super(block, uri, rootPath);
        this.astNode = block;
    }

    getDefinitionNode(): Node | undefined {
        return undefined;
    }

    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node {
        this.setExpressionNode(expression);

        for (const statement of this.astNode.statements) {
            find(statement, this.uri, this.rootPath).accept(find, orphanNodes, parent);
        }
        
        return this;
    }
}
