import { ConstrainMutability } from "./diagnostics/ConstrainMutability";
import { SpecifyVisibility } from "./diagnostics/SpecifyVisibility";
import { CompilerDiagnostic } from "./types";

export const compilerDiagnostics: { [key: string]: CompilerDiagnostic } = [
  new ConstrainMutability(),
  new SpecifyVisibility(),
].reduce((acc, item) => ({ ...acc, [item.code]: item }), {});
