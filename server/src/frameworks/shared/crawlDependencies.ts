import { analyze } from "@nomicfoundation/solidity-analyzer";
import { analyzeSolFile } from "../../parser/analyzer/analyzeSolFile";
import { getOrInitialiseSolFileEntry } from "../../utils/getOrInitialiseSolFileEntry";
import { Project } from "../base/Project";

interface DependencyDetail {
  absolutePath: string;
  pragmas: string[];
}

export async function getDependenciesAndPragmas(
  project: Project,
  sourceUri: string,
  visited: string[] = []
): Promise<DependencyDetail[]> {
  if (visited.includes(sourceUri)) {
    return [];
  }

  let text = project.serverState.solFileIndex[sourceUri]?.text;

  if (text === undefined) {
    // TODO: inject this
    const solFileEntry = getOrInitialiseSolFileEntry(
      project.serverState,
      sourceUri
    );

    if (!solFileEntry.isAnalyzed()) {
      await analyzeSolFile(project.serverState, solFileEntry);
    }
  }

  text = project.serverState.solFileIndex[sourceUri]?.text;

  if (text === undefined) {
    throw new Error(`Couldnt find/index ${sourceUri}`);
  }

  visited.push(sourceUri);

  // Analyze current file for import strings and pragmas
  const { imports, versionPragmas } = analyze(text);

  // Build list with current file and prepare for dependencies
  const dependencyDetails = [
    { absolutePath: sourceUri, pragmas: versionPragmas },
  ];

  // Recursively crawl dependencies and append. Skip non-existing imports
  const importsUris: string[] = [];
  for (const _import of imports) {
    const resolvedImport = await project.resolveImportPath(sourceUri, _import);

    if (resolvedImport !== undefined) {
      importsUris.push(resolvedImport);
    }
  }

  for (const importUri of importsUris) {
    dependencyDetails.push(
      ...(await getDependenciesAndPragmas(project, importUri, visited))
    );
  }

  return dependencyDetails;
}
