import { ISolFileEntry, TextDocument } from "@common/types";
import { Project } from "../frameworks/base/Project";
import { ServerState } from "../types";
import { runningOnWindows } from "../utils/operatingSystem";

export function getOpenDocumentsInProject(
  serverState: ServerState,
  project: Project
): TextDocument[] {
  const openSolFilesInProj = Object.values(serverState.solFileIndex).filter(
    (solfile) => solfile.project.basePath === project.basePath
  );

  const openDocuments = openSolFilesInProj
    .map((solFile) => lookupDocForSolFileEntry(serverState, solFile))
    .filter((doc): doc is TextDocument => doc !== undefined);

  return openDocuments;
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
