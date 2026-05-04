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
 * Builds the signature from individual fields (which may have been widened)
 * rather than the original CST signatureText.
 */
function generateFunctionStub(
  fn: FunctionInfo,
  overrides: OverrideEntry[]
): string {
  // Extract params text from signatureText
  const paramsText = extractParamsFromSignature(fn.signatureText);
  const overrideText = buildOverrideText(overrides);

  let sig = `function ${fn.name ?? ""}${paramsText}`;

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

/**
 * Extract the parameters portion "(params)" from a signatureText.
 * The signatureText format is: "function name(params) visibility mutability returns(...)"
 */
function extractParamsFromSignature(signatureText: string): string {
  const openParen = signatureText.indexOf("(");

  if (openParen === -1) {
    return "()";
  }

  // Find matching close paren
  let depth = 0;

  for (let i = openParen; i < signatureText.length; i++) {
    if (signatureText[i] === "(") {
      depth++;
    } else if (signatureText[i] === ")") {
      depth--;

      if (depth === 0) {
        return signatureText.slice(openParen, i + 1);
      }
    }
  }

  return "()";
}

function buildOverrideText(overrides: OverrideEntry[]): string {
  if (overrides.length === 0) {
    return "override";
  }

  const names = overrides.map((o) => o.namePath).join(", ");
  return `override(${names})`;
}
