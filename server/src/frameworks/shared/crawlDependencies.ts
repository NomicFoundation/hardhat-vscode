import { analyze } from "@nomicfoundation/solidity-analyzer";
import _ from "lodash";
import { analyzeSolFile } from "../../parser/analyzer/analyzeSolFile";
import { getOrInitialiseSolFileEntry } from "../../utils/getOrInitialiseSolFileEntry";
import { Project } from "../base/Project";

interface DependencyDetail {
  sourceName: string;
  absolutePath: string;
  pragmas: string[];
}

export async function getDependenciesAndPragmas(
  project: Project,
  sourcePath: string,
  sourceName: string = sourcePath,
  visited: Array<{ importName: string; resolvedPath: string }> = []
): Promise<DependencyDetail[]> {
  if (_.some(visited, { importName: sourceName, resolvedPath: sourcePath })) {
    return [];
  }

  let text = project.serverState.solFileIndex[sourcePath]?.text;

  if (text === undefined) {
    // TODO: inject this
    const solFileEntry = getOrInitialiseSolFileEntry(
      project.serverState,
      sourcePath
    );

    if (!solFileEntry.isAnalyzed()) {
      await analyzeSolFile(project.serverState, solFileEntry);
    }
  }

  text = project.serverState.solFileIndex[sourcePath]?.text;

  if (text === undefined) {
    throw new Error(`Couldnt find/index ${sourcePath}`);
  }

  visited.push({ importName: sourceName, resolvedPath: sourcePath });

  // Analyze current file for import strings and pragmas
  const { imports, versionPragmas } = analyze(text);

  // Build list with current file and prepare for dependencies
  const dependencyDetails = [
    { sourceName, absolutePath: sourcePath, pragmas: versionPragmas },
  ];

  // Recursively crawl dependencies and append. Skip non-existing imports
  const resolvedImports: Array<{ importName: string; resolvedPath: string }> =
    [];
  for (const importName of imports) {
    const resolvedPath = await project.resolveImportPath(
      sourcePath,
      importName
    );

    if (resolvedPath !== undefined) {
      resolvedImports.push({ importName, resolvedPath });
    }
  }

  for (const resolvedImport of resolvedImports) {
    dependencyDetails.push(
      ...(await getDependenciesAndPragmas(
        project,
        resolvedImport.resolvedPath,
        resolvedImport.importName,
        visited
      ))
    );
  }

  return dependencyDetails;
}
