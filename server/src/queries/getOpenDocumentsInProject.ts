import os from "os";
import { isHardhatProject } from "@analyzer/HardhatProject";
import {
  ClientTrackingState,
  ISolFileEntry,
  ISolProject,
  TextDocument,
} from "@common/types";
import { ServerState } from "../types";

export function getOpenDocumentsInProject(
  serverState: ServerState,
  project: ISolProject
): TextDocument[] {
  if (!isHardhatProject(project)) {
    throw new Error("Cannot query for docs in non-hardhat project");
  }

  const openSolFilesInProj = Object.values(serverState.solFileIndex).filter(
    (solfile) =>
      solfile.tracking === ClientTrackingState.TRACKED &&
      isHardhatProject(solfile.project) &&
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
  const convertedUri =
    os.platform() === "win32"
      ? `file:///${solFile.uri.replace(":", "%3A")}`
      : `file://${solFile.uri}`;

  return serverState.documents.get(convertedUri);
}
