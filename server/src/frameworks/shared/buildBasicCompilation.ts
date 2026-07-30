import _ from "lodash";
import semver from "semver";
import { OpenDocuments } from "../../types";
import { isRelativeImport } from "../../utils";
import { CompilationDetails } from "../base/CompilationDetails";
import { Project } from "../base/Project";
import { getDependenciesAndPragmas } from "./crawlDependencies";

export async function buildBasicCompilation(
  project: Project,
  sourceUri: string,
  openDocuments: OpenDocuments,
  explicitSolcVersion?: string
): Promise<CompilationDetails> {
  // Load contract text from openDocuments
  const documentText = openDocuments.find(
    (doc) => doc.uri === sourceUri
  )?.documentText;

  if (documentText === undefined) {
    throw new Error(
      `sourceUri (${sourceUri}) should be included in openDocuments ${JSON.stringify(
        openDocuments.map((doc) => doc.uri)
      )} `
    );
  }

  // Get list of all dependencies (deep) and their pragma statements
  const dependencyDetails = await getDependenciesAndPragmas(project, sourceUri);
  // console.log(JSON.stringify(dependencyDetails, null, 2));

  const pragmas = _.flatten(_.map(dependencyDetails, "pragmas"));

  // Use specified solc version or determine it based on available versions and pragma statements
  let solcVersion = explicitSolcVersion;

  if (solcVersion === undefined) {
    // every pragma in the dependency tree has to be satisfied at once
    const combinedRange = pragmas.join(" ");

    const resolvedSolcVersion = semver.maxSatisfying(
      project.serverState.solcVersions,
      combinedRange
    );

    if (resolvedSolcVersion === null) {
      throw new Error(
        buildNoVersionError(pragmas, project.serverState.solcVersions)
      );
    }

    solcVersion = resolvedSolcVersion;
  }

  // Build solc input
  const sources: { [uri: string]: { content: string } } = {};
  const remappings: string[] = [];

  for (const { sourceName, absolutePath } of dependencyDetails) {
    // Read all sol files via openDocuments or solFileIndex
    const contractText =
      openDocuments.find((doc) => doc.uri === absolutePath)?.documentText ??
      project.serverState.solFileIndex[absolutePath].text;
    if (contractText === undefined) {
      throw new Error(`Contract not indexed: ${absolutePath}`);
    }
    sources[absolutePath] = { content: contractText };

    if (!isRelativeImport(sourceName) && sourceName !== absolutePath) {
      remappings.push(`${sourceName}=${absolutePath}`);
    }
  }

  sources[sourceUri] = { content: documentText };

  return {
    input: {
      language: "Solidity",
      sources,
      settings: {
        outputSelection: {},
        remappings,
        optimizer: {
          enabled: false,
          runs: 200,
        },
      },
    },
    solcVersion,
  };
}

/**
 * The pragmas are ANDed together, so the useful thing to report is the distinct
 * set and what was actually available to satisfy it - not a comma-joined dump
 * of every pragma in the dependency tree, most of which are duplicates.
 */
export function buildNoVersionError(
  pragmas: string[],
  availableVersions: string[]
) {
  const distinctPragmas = _.uniq(pragmas);

  const requirement = distinctPragmas.join(" ");
  const pragmaCount =
    distinctPragmas.length === 1
      ? "1 pragma"
      : `${distinctPragmas.length} distinct pragmas`;

  // Only the bounds - the full list is ~100 entries and tells the reader
  // nothing the range doesn't. Computed rather than taken from the ends of the
  // array so the message stays correct if the list is ever unsorted.
  const sorted = [...availableVersions].sort(semver.compare);

  const available =
    sorted.length === 0
      ? "none"
      : sorted.length === 1
        ? sorted[0]
        : `${sorted[0]} - ${sorted[sorted.length - 1]}`;

  return `No available solc version satisfying ${requirement} (${pragmaCount} across the dependency tree). Available versions: ${available}`;
}
