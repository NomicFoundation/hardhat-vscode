import { CompletionItemKind } from "@common/types";

export const arrayCompletions = [
  {
    label: "length",
    kind: CompletionItemKind.Property,
  },
  {
    label: "pop",
    kind: CompletionItemKind.Function,
  },
  {
    label: "push",
    kind: CompletionItemKind.Function,
  },
];
