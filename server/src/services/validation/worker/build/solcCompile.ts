import { HardhatCompilerError, WorkerState } from "../../../../types";
import { SolcInput } from "./buildInputsToSolc";

export interface SolcResult {
  output: {
    errors: HardhatCompilerError[];
    sources: {
      [key: string]: unknown;
    };
  };
}

export function solcCompile(
  { hre, tasks: { TASK_COMPILE_SOLIDITY_COMPILE } }: WorkerState,
  { solcVersion, input, compilationJob }: SolcInput
): Promise<SolcResult> {
  return hre.run(TASK_COMPILE_SOLIDITY_COMPILE, {
    solcVersion,
    input,
    quiet: true,
    compilationJob,
    compilationJobs: [compilationJob],
    compilationJobIndex: 0,
  });
}
