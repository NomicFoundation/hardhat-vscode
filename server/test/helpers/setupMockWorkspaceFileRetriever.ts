import * as sinon from "sinon";
import { WorkspaceFileRetriever } from "@analyzer/WorkspaceFileRetriever";

export function setupMockWorkspaceFileRetriever(): WorkspaceFileRetriever {
  return {
    findSolFiles: sinon.spy(),
  };
}
