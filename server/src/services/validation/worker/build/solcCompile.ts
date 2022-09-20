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

  // Normalize errors' sourceLocation to use utf-8 offsets instead of byte offsets
  for (const error of output.errors || []) {
    const source = input.sources[error.sourceLocation?.file];

    if (source === undefined) {
      continue;
    }

    error.sourceLocation.start = normalizeOffset(
      source.content,
      error.sourceLocation.start
    );
    error.sourceLocation.end = normalizeOffset(
      source.content,
      error.sourceLocation.end
    );
  }

  return { output, solcBuild };
}

const normalizeOffset = (text: string, offset: number) => {
  if (offset < 0) {
    return offset; // don't transform negative offsets
  } else {
    return Buffer.from(text, "utf-8").slice(0, offset).toString("utf-8").length;
  }
};
