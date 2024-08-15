import { SymbolKind } from "vscode-languageserver-types";
import { Query } from "@nomicfoundation/slang/query";
import { SymbolFinder } from "../SymbolFinder";

export class EventDefinition extends SymbolFinder {
  public override readonly symbolKind = SymbolKind.Event;

  public override readonly query = Query.parse(`
    @definition [EventDefinition
      @identifier name: [_]
    ]
  `);
}
