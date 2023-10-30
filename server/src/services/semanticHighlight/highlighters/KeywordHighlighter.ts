import { SemanticTokenTypes } from "vscode-languageserver-protocol";
import { TokenKind } from "@nomicfoundation/slang/kinds";
import { NodeType } from "@nomicfoundation/slang/cst";
import { Cursor } from "@nomicfoundation/slang/cursor";
import { HighlightVisitor } from "../HighlightVisitor";
import { SlangNodeWrapper } from "../../../parser/slangHelpers";

const keywordKinds = new Set([
  TokenKind.ABICoderKeyword,
  TokenKind.AbstractKeyword,
  TokenKind.AddressKeyword,
  TokenKind.AnonymousKeyword,
  TokenKind.AsKeyword,
  TokenKind.AssemblyKeyword,
  TokenKind.BoolKeyword,
  TokenKind.BreakKeyword,
  TokenKind.CalldataKeyword,
  TokenKind.CaseKeyword,
  TokenKind.CatchKeyword,
  TokenKind.ConstantKeyword,
  TokenKind.ConstructorKeyword,
  TokenKind.ContinueKeyword,
  TokenKind.ContractKeyword,
  TokenKind.DaysKeyword,
  TokenKind.DefaultKeyword,
  TokenKind.DeleteKeyword,
  TokenKind.DoKeyword,
  TokenKind.ElseKeyword,
  TokenKind.EmitKeyword,
  TokenKind.EnumKeyword,
  TokenKind.ErrorKeyword,
  TokenKind.EtherKeyword,
  TokenKind.EventKeyword,
  TokenKind.ExperimentalKeyword,
  TokenKind.ExternalKeyword,
  TokenKind.FallbackKeyword,
  TokenKind.FalseKeyword,
  TokenKind.FinneyKeyword,
  TokenKind.ForKeyword,
  TokenKind.FromKeyword,
  TokenKind.FunctionKeyword,
  TokenKind.GlobalKeyword,
  TokenKind.GweiKeyword,
  TokenKind.HoursKeyword,
  TokenKind.IfKeyword,
  TokenKind.ImmutableKeyword,
  TokenKind.ImportKeyword,
  TokenKind.IndexedKeyword,
  TokenKind.InterfaceKeyword,
  TokenKind.InternalKeyword,
  TokenKind.IsKeyword,
  TokenKind.LeaveKeyword,
  TokenKind.LetKeyword,
  TokenKind.LibraryKeyword,
  TokenKind.MappingKeyword,
  TokenKind.MemoryKeyword,
  TokenKind.MinutesKeyword,
  TokenKind.ModifierKeyword,
  TokenKind.NewKeyword,
  TokenKind.OverrideKeyword,
  TokenKind.PayableKeyword,
  TokenKind.PragmaKeyword,
  TokenKind.PrivateKeyword,
  TokenKind.PublicKeyword,
  TokenKind.PureKeyword,
  TokenKind.ReceiveKeyword,
  TokenKind.ReturnKeyword,
  TokenKind.ReturnsKeyword,
  TokenKind.RevertKeyword,
  TokenKind.SecondsKeyword,
  TokenKind.SolidityKeyword,
  TokenKind.StorageKeyword,
  TokenKind.StringKeyword,
  TokenKind.StructKeyword,
  TokenKind.SwitchKeyword,
  TokenKind.SzaboKeyword,
  TokenKind.ThrowKeyword,
  TokenKind.TrueKeyword,
  TokenKind.TryKeyword,
  TokenKind.TypeKeyword,
  TokenKind.UncheckedKeyword,
  TokenKind.UnsignedIntegerType,
  TokenKind.UsingKeyword,
  TokenKind.ViewKeyword,
  TokenKind.VirtualKeyword,
  TokenKind.WeeksKeyword,
  TokenKind.WeiKeyword,
  TokenKind.WhileKeyword,
  TokenKind.YearsKeyword,
]);

// Highlights keywords
export class KeywordHighlighter extends HighlightVisitor {
  public enter(nodeWrapper: SlangNodeWrapper): void {
    if (
      nodeWrapper.type === NodeType.Token &&
      keywordKinds.has(nodeWrapper.kind as TokenKind)
    ) {
      this.tokenBuilder.addToken(nodeWrapper, SemanticTokenTypes.keyword);
    }
  }
}
