import { EnumValue, FinderType, SolFileIndexMap, Node } from "@common/types";

export class EnumValueNode extends Node {
  public astNode: EnumValue;

  public connectionTypeRules: string[] = ["MemberAccess"];

  constructor(
    enumValue: EnumValue,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) {
    super(enumValue, uri, rootPath, documentsAnalyzer, enumValue.name);

    if (enumValue.loc) {
      // Bug in solidity parser doesn't give exact end location
      enumValue.loc.end.column =
        enumValue.loc.end.column + enumValue.name.length;

      this.nameLoc = JSON.parse(JSON.stringify(enumValue.loc));
    }

    this.astNode = enumValue;
  }

  public getDefinitionNode(): Node | undefined {
    return this;
  }

  public async accept(
    find: FinderType,
    orphanNodes: Node[],
    parent?: Node,
    expression?: Node
  ): Promise<Node> {
    this.setExpressionNode(expression);

    if (parent) {
      this.setParent(parent);
    }

    parent?.addChild(this);

    return this;
  }
}
