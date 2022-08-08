import { AddMultiOverrideSpecifier } from "./diagnostics/AddMultiOverrideSpecifier";
import { AddOverrideSpecifier } from "./diagnostics/AddOverrideSpecifier";
import { AddVirtualSpecifier } from "./diagnostics/AddVirtualSpecifier";
import { ConstrainMutability } from "./diagnostics/ConstrainMutability";
import { ContractCodeSize } from "./diagnostics/ContractCodeSize";
import { MarkContractAbstract } from "./diagnostics/MarkContractAbstract";
import { SpecifyVisibility } from "./diagnostics/SpecifyVisibility";
import { SpecifyCompilerVersion } from "./diagnostics/SpecifyCompilerVersion";
import { CompilerDiagnostic } from "./types";

export const compilerDiagnostics: { [key: string]: CompilerDiagnostic } = [
  new AddOverrideSpecifier(),
  new AddMultiOverrideSpecifier(),
  new AddVirtualSpecifier(),
  new ConstrainMutability(),
  new ContractCodeSize(),
  new MarkContractAbstract(),
  new SpecifyVisibility(),
  new SpecifyCompilerVersion(),
].reduce((acc, item) => ({ ...acc, [item.code]: item }), {});
