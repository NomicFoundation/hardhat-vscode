import { NodeType, RuleKind, TokenKind } from "@nomicfoundation/slang";
import _ from "lodash";
import { HighlightVisitor } from "../HighlightVisitor";
import { SlangNode } from "../slangHelpers";

const nodeTypeMap = _.invert(NodeType);
const ruleKindMap = _.invert(RuleKind);
const tokenKindMap = _.invert(TokenKind);

// Visitor that logs the tree as indented text
export class Logger extends HighlightVisitor {
  public visit(node: SlangNode, ancestors: SlangNode[]): void {
    const nodeText = JSON.stringify(
      _.truncate(
        this.document
          .getText()
          .slice(Number(node.charRange[0]), Number(node.charRange[1])),
        {
          length: 20,
        }
      )
    );

    const indentation = " ".repeat(ancestors.length * 2);
    const kindMap = node.type === NodeType.Rule ? ruleKindMap : tokenKindMap;

    // eslint-disable-next-line no-console
    console.log(
      `${indentation}${nodeTypeMap[node.type]}: ${
        kindMap[node.kind]
      } ${nodeText}`
    );
  }
}
