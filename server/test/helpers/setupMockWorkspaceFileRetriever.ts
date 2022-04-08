import { WorkspaceFileRetriever } from "@analyzer/WorkspaceFileRetriever";

export function setupMockWorkspaceFileRetriever(
  projects: string[] = []
): WorkspaceFileRetriever {
  return {
    findFiles: async (_baseUri: string, globPattern: string) => {
      if (globPattern === "**/hardhat.config.{ts,js}") {
        return projects;
      }

      return [];
    },
    readFile: async () => {
      return "";
    },
  };
}
