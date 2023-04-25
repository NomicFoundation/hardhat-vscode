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
    const resolvedSolcVersion = semver.maxSatisfying(
      project.serverState.solcVersions,
      pragmas.join(" ")
    );

    if (resolvedSolcVersion === null) {
      throw new Error(`No available solc version satisfying ${pragmas}`);
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
