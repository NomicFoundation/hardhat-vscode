import { CompilerInput } from "hardhat/types";

export default interface CompilationDetails {
  input: CompilerInput;
  solcVersion: string;
}
