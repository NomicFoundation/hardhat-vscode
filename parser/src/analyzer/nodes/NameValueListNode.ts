import { NameValueList, FinderType, Node } from "@common/types";

export class NameValueListNode extends Node {
    astNode: NameValueList;

    constructor (nameValueList: NameValueList, uri: string, rootPath: string) {
        super(nameValueList, uri, rootPath);
        this.astNode = nameValueList;
        // TO-DO: Implement name location for rename
    }

    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node {
        this.setExpressionNode(expression);
        // TO-DO: Method not implemented
        return this;
    }
}
