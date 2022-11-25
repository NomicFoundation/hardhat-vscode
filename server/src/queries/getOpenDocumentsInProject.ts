import { ISolFileEntry, TextDocument } from "@common/types";
import { URI } from "vscode-uri";
import { Project } from "../frameworks/base/Project";
import { ServerState } from "../types";

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
  const convertedUri = URI.file(solFile.uri).toString();

  return serverState.documents.get(convertedUri);
}
