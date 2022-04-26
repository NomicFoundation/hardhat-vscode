import { WorkspaceFileRetriever } from "@analyzer/WorkspaceFileRetriever";

export function setupMockWorkspaceFileRetriever(
  projects: string[] = [],
  solFiles: string[] = []
): WorkspaceFileRetriever {
  return {
    findFiles: async (_baseUri: string, globPattern: string) => {
      if (globPattern === "**/hardhat.config.{ts,js}") {
        return projects;
      }

      if (globPattern === "**/*.sol") {
        return solFiles;
      }

      return [];
    },
    readFile: async () => {
      return "";
    },
  };
}
