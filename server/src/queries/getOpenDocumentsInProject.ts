import {
  ClientTrackingState,
  ISolFileEntry,
  ISolProject,
  TextDocument,
} from "@common/types";
import { ServerState } from "../types";
import { runningOnWindows } from "../utils/operatingSystem";

export function getOpenDocumentsInProject(
  serverState: ServerState,
  project: ISolProject
): TextDocument[] {
  const openSolFilesInProj = Object.values(serverState.solFileIndex).filter(
    (solfile) =>
      solfile.tracking === ClientTrackingState.TRACKED &&
      solfile.project.basePath === project.basePath
  );

  const openDocs = openSolFilesInProj
    .map((solFile) => lookupDocForSolFileEntry(serverState, solFile))
    .filter((doc): doc is TextDocument => doc !== undefined);

  if (openDocs.length < openSolFilesInProj.length) {
    serverState.logger.info("Open document lookup has dropped files");
  }

  return openDocs;
}

function lookupDocForSolFileEntry(
  serverState: ServerState,
  solFile: ISolFileEntry
): TextDocument | undefined {
  const convertedUri = runningOnWindows()
    ? `file:///${solFile.uri.replace(":", "%3A")}`
    : `file://${solFile.uri}`;

  return serverState.documents.get(convertedUri);
}
