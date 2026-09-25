import path from "node:path";
import { EXAMPLE_WORKSPACES_DIR } from "./paths.ts";

/**
 * The example workspaces, by the name `--workspace` takes. Each is a
 * standalone project under `example-workspaces/`, and the framework decides
 * how it is installed, built and tested.
 */
export const WORKSPACES = {
  hardhat3: { framework: "hardhat" },
  foundry: { framework: "foundry" },
  hardhat2: { framework: "hardhat" },
} as const;

export type WorkspaceName = keyof typeof WORKSPACES;

export type Framework = (typeof WORKSPACES)[WorkspaceName]["framework"];

/** The forge-std release `init` installs into the Foundry workspace's `lib/`. */
export const FORGE_STD_VERSION = "v1.16.2";

export interface Workspace {
  name: WorkspaceName;
  framework: Framework;
  dir: string;
}

export function workspaceNames(): WorkspaceName[] {
  return Object.keys(WORKSPACES) as WorkspaceName[];
}

function isWorkspaceName(name: string): name is WorkspaceName {
  return Object.hasOwn(WORKSPACES, name);
}

export function resolveWorkspace(name: string): Workspace {
  if (!isWorkspaceName(name)) {
    throw new Error(
      `Unknown workspace: ${name}. Expected one of: ${workspaceNames().join(", ")}`
    );
  }

  return {
    name,
    framework: WORKSPACES[name].framework,
    dir: path.join(EXAMPLE_WORKSPACES_DIR, name),
  };
}
