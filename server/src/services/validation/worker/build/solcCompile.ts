import type { SolcBuild } from "hardhat/types";
import { HardhatCompilerError, WorkerState } from "../../../../types";
import { SolcInput } from "./buildInputsToSolc";

export interface SolcResult {
  output: {
    errors: HardhatCompilerError[];
    sources: {
      [key: string]: unknown;
    };
  };
  solcBuild: SolcBuild;
}

export async function solcCompile(
  {
    hre,
    tasks: { TASK_COMPILE_SOLIDITY_RUN_SOLCJS, TASK_COMPILE_SOLIDITY_RUN_SOLC },
  }: WorkerState,
  { input, solcBuild }: SolcInput
): Promise<SolcResult> {
  let output;

  if (solcBuild.isSolcJs) {
    output = await hre.run(TASK_COMPILE_SOLIDITY_RUN_SOLCJS, {
      input,
      solcJsPath: solcBuild.compilerPath,
    });
  } else {
    output = await hre.run(TASK_COMPILE_SOLIDITY_RUN_SOLC, {
      input,
      solcPath: solcBuild.compilerPath,
    });
  }

  return { output, solcBuild };
}
