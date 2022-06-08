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

  const originalInput = input as { settings: {} };

  const overriddenInput = {
    ...originalInput,
    settings: {
      ...originalInput.settings,
      outputSelection: {},
    },
  };

  if (solcBuild.isSolcJs) {
    output = await hre.run(TASK_COMPILE_SOLIDITY_RUN_SOLCJS, {
      input: overriddenInput,
      solcJsPath: solcBuild.compilerPath,
    });
  } else {
    output = await hre.run(TASK_COMPILE_SOLIDITY_RUN_SOLC, {
      input: overriddenInput,
      solcPath: solcBuild.compilerPath,
    });
  }

  return { output, solcBuild };
}
