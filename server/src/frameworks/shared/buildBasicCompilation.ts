import _ from "lodash";
import semver from "semver";
import { OpenDocuments } from "../../types";
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
  const filePathsToCompile = _.map(dependencyDetails, "absolutePath");
  const sources: { [uri: string]: { content: string } } = {};
  for (const filePath of filePathsToCompile) {
    // Read all sol files via openDocuments or solFileIndex
    const contractText =
      openDocuments.find((doc) => doc.uri === filePath)?.documentText ??
      project.serverState.solFileIndex[filePath].text;
    if (contractText === undefined) {
      throw new Error(`Contract not indexed: ${filePath}`);
    }
    sources[filePath] = { content: contractText };
  }

  sources[sourceUri] = { content: documentText };

  return {
    input: {
      language: "Solidity",
      sources,
      settings: {
        outputSelection: {},
        optimizer: {
          enabled: false,
          runs: 200,
        },
      },
    },
    solcVersion,
  };
}
