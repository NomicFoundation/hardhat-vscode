import { TextDocument, Range } from "@common/types";
import { SolcError } from "../../types";
import { passThroughConversion } from "./passThroughConversion";

export function constrainByRegex(
  document: TextDocument,
  error: SolcError,
  regex: RegExp
) {
  if (error.sourceLocation === undefined) {
    throw new Error("No source location");
  }

  const diagnostic = passThroughConversion(document, error);

  const matchResult = findMatchInRange(document, error.sourceLocation, regex);

  if (!matchResult) {
    return diagnostic;
  }

  const updatedRange = Range.create(
    document.positionAt(error.sourceLocation.start + matchResult.index),
    document.positionAt(
      error.sourceLocation.start + matchResult.index + matchResult.text.length
    )
  );

  return {
    ...diagnostic,
    range: updatedRange,
    data: {
      functionSourceLocation: {
        start: error.sourceLocation.start,
        end: error.sourceLocation.end,
      },
    },
  };
}

function findMatchInRange(
  document: TextDocument,
  sourceLocation: { start: number; end: number },
  regex: RegExp
) {
  const range = Range.create(
    document.positionAt(sourceLocation.start),
    document.positionAt(sourceLocation.end)
  );

  const text = document.getText(range);

  const match = regex.exec(text);

  if (!match) {
    return null;
  }

  const [matchedText] = match;

  return { index: match.index, text: matchedText };
}
