import { run } from "../utils/process.ts";
import { requireRecordedWorkspace } from "../utils/state.ts";

/**
 * Build the current workspace and run its tests, to check that edits made
 * while exploring have not broken it. Stops at the first failure.
 */
export function validate(): void {
  const { name, framework, dir } = requireRecordedWorkspace();

  console.log(`Validating ${name}`);

  switch (framework) {
    case "hardhat":
      run("pnpm", ["exec", "hardhat", "compile"], dir);
      run("pnpm", ["exec", "hardhat", "test"], dir);
      break;
    case "foundry":
      run("forge", ["build"], dir);
      run("forge", ["test"], dir);
      break;
  }

  console.log(`\n${name} builds and its tests pass`);
}
