import { appendFileSync } from "node:fs";

/** Set a step output, the way `>> $GITHUB_OUTPUT` does in shell. */
export function setOutput(name: string, value: string): void {
  console.log(`${name}=${value}`);

  if (process.env.GITHUB_OUTPUT !== undefined) {
    appendFileSync(process.env.GITHUB_OUTPUT, `${name}=${value}\n`);
  }
}
