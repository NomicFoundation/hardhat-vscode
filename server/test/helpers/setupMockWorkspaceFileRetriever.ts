import { decodeUriAndRemoveFilePrefix } from "@utils/index";
import sinon from "sinon";
import { WorkspaceFileRetriever } from "../../src/utils/WorkspaceFileRetriever";

export function setupMockWorkspaceFileRetriever(
  projects: { [key: string]: string[] } = {},
  solFiles: { [key: string]: string[] } = {}
): WorkspaceFileRetriever {
  const findFiles = async (
    baseUri: string,
    globPattern: string
  ): Promise<string[]> => {
    let simplifiedUri = decodeUriAndRemoveFilePrefix(baseUri);

    if (!simplifiedUri.startsWith("/")) {
      simplifiedUri = `/${simplifiedUri}`;
    }

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
  };

  const readFile = async () => {
    return "";
  };

  const fileExists = async () => {
    return false;
  };

  return {
    findFiles: sinon.spy(findFiles),
    readFile: sinon.spy(readFile),
    fileExists: sinon.spy(fileExists),
  };
}
