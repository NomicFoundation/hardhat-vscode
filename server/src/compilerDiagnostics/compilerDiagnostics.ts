import { AddOverrideSpecifier } from "./diagnostics/AddOverrideSpecifier";
import { AddVirtualSpecifier } from "./diagnostics/AddVirtualSpecifier";
import { ConstrainMutability } from "./diagnostics/ConstrainMutability";
import { SpecifyVisibility } from "./diagnostics/SpecifyVisibility";
import { CompilerDiagnostic } from "./types";

export const compilerDiagnostics: { [key: string]: CompilerDiagnostic } = [
  new AddOverrideSpecifier(),
  new AddVirtualSpecifier(),
  new ConstrainMutability(),
  new SpecifyVisibility(),
].reduce((acc, item) => ({ ...acc, [item.code]: item }), {});
