import { EnumValue, FinderType, DocumentsAnalyzerMap, Node } from "@common/types";

export class EnumValueNode extends Node {
    astNode: EnumValue;

    connectionTypeRules: string[] = [ "MemberAccess" ];

    constructor (enumValue: EnumValue, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap) {
        super(enumValue, uri, rootPath, documentsAnalyzer);

        if (enumValue.loc) {
            // Bug in solidity parser doesn't give exact end location
            enumValue.loc.end.column = enumValue.loc.end.column + enumValue.name.length;

            this.nameLoc = JSON.parse(JSON.stringify(enumValue.loc));
        }

        this.astNode = enumValue;
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

        parent?.addChild(this);

        return this;
    }
}
