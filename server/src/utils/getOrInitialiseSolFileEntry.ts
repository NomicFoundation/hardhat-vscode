import * as fs from "fs";
import { ISolFileEntry } from "@common/types";
import { findProjectFor } from "@utils/findProjectFor";
import { SolFileEntry } from "../parser/analyzer/SolFileEntry";
import { ServerState } from "../types";

/**
 * Get or create a Solidity file entry for the servers file index.
 *
 * @param uri The path to the file with the document.
 * Uri needs to be decoded and without the "file://" prefix.
 */
export function getOrInitialiseSolFileEntry(
  serverState: ServerState,
  uri: string
): ISolFileEntry {
  let solFileEntry = serverState.solFileIndex[uri];

  if (solFileEntry === undefined) {
    const project = findProjectFor(serverState, uri);

    if (fs.existsSync(uri)) {
      const docText = fs.readFileSync(uri).toString();
      solFileEntry = SolFileEntry.createLoadedTrackedEntry(
        uri,
        project,
        docText
      );
    } else {
      // TODO: figure out what happens if we just don't do this
      // why bother with non-existant files? Maybe untitled but unsaved
      // files?
      solFileEntry = SolFileEntry.createUnloadedEntry(uri, project);
    }

    serverState.solFileIndex[uri] = solFileEntry;
  }

  return solFileEntry;
}
