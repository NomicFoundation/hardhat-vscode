import { Range, TextEdit } from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";
import { PrettyPrinter } from "../../../../utils/PrettyPrinter";
import { ContractInfo, FunctionInfo } from "./types";
import { ResolvedFunction } from "./utils/convertFunctionRecordsToMissingImplementations";
import { OverrideEntry } from "./utils/resolveImplementationOverrides";

export function createAppendFunctionsToContractChange(
  contractNode: ContractInfo,
  functions: ResolvedFunction[],
  { document }: { document: TextDocument }
): TextEdit {
  const prettyPrinter = new PrettyPrinter();

  const range = Range.create(
    document.positionAt(contractNode.charRange[0]),
    document.positionAt(contractNode.charRange[1])
  );

  const originalText = document.getText(range);

  // Generate function stub text for each missing function
  const functionStubs = functions.map((fn) =>
    generateFunctionStub(fn.info, fn.overrides)
  );

  const functionsAppendText = functionStubs
    .map((stub) => `    ${stub}`)
    .join("\n\n");

  // Remove trailing } and whitespace, append functions, add closing }
  const trimmed = originalText.replace(/\s*\}\s*$/, "");
  const combined = `${trimmed}\n${functionsAppendText}\n}`;

  // Format with prettier
  const newText = prettyPrinter.format(combined, { document }).slice(0, -1);

  return { range, newText };
}

/**
 * Generate a function stub from FunctionInfo + override specifiers.
 * Uses the parameter list as carried verbatim from the source AST, so
 * the stub always reflects the original parameters exactly — no
 * string-round-trip parsing of a reconstructed signature.
 */
function generateFunctionStub(
  fn: FunctionInfo,
  overrides: OverrideEntry[]
): string {
  const overrideText = buildOverrideText(overrides);

  let sig = `function ${fn.name ?? ""}${fn.paramListText}`;

  if (fn.visibility !== null) {
    sig += ` ${fn.visibility}`;
  }

  if (fn.mutability !== null) {
    sig += ` ${fn.mutability}`;
  }

  sig += ` ${overrideText}`;

  if (fn.returnsText !== null) {
    sig += ` ${fn.returnsText}`;
  }

  sig += " {}";

  return sig;
}

function buildOverrideText(overrides: OverrideEntry[]): string {
  if (overrides.length === 0) {
    return "override";
  }

  const names = overrides.map((o) => o.namePath).join(", ");
  return `override(${names})`;
}
