import { CompilerInput } from "hardhat/types";

export interface CompilationDetails {
  input: CompilerInput;
  solcVersion: string;
}
