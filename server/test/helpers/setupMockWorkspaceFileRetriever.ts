import { WorkspaceFileRetriever } from "@analyzer/WorkspaceFileRetriever";
import { decodeUriAndRemoveFilePrefix } from "@utils/index";

export function setupMockWorkspaceFileRetriever(
  projects: { [key: string]: string[] } = {},
  solFiles: { [key: string]: string[] } = {}
): WorkspaceFileRetriever {
  return {
    findFiles: async (
      baseUri: string,
      globPattern: string
    ): Promise<string[]> => {
      const simplifiedUri = decodeUriAndRemoveFilePrefix(baseUri);

      if (globPattern === "**/hardhat.config.{ts,js}") {
        if (simplifiedUri in projects) {
          return projects[simplifiedUri];
        } else {
          return [];
        }
      }

      if (globPattern === "**/*.sol") {
        if (simplifiedUri in solFiles) {
          return solFiles[simplifiedUri];
        } else {
          return [];
        }
      }

      return [];
    },
    readFile: async () => {
      return "";
    },
  };
}
