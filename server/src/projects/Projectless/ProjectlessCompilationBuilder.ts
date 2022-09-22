import { analyze } from "@nomicfoundation/solidity-analyzer";
import _ from "lodash";
import semver from "semver";
import { WorkspaceFileRetriever } from "../../parser/analyzer/WorkspaceFileRetriever";
import { analyzeSolFiles } from "../../services/initialization/indexWorkspaceFolders";
import CompilationBuilder from "../base/CompilationBuilder";
import CompilationDetails from "../base/CompilationDetails";

interface SolFileDetails {
  path: string;
  pragmas: string[];
}

export default class ProjectlessCompilationBuilder extends CompilationBuilder {
  public async buildCompilation(
    sourceUri: string,
    openDocs: Array<{ uri: string; documentText: string }>
  ): Promise<CompilationDetails> {
    const documentText = openDocs.find(
      (doc) => doc.uri === sourceUri
    )?.documentText;

    if (documentText === undefined) {
      throw new Error("sourceUri should be included in openDocuments");
    }

    const dependencyDetails = await this._crawlDependencies(sourceUri);
    const pragmas = _.flatten(_.map(dependencyDetails, "pragmas"));

    const solcVersion = semver.maxSatisfying(
      this.serverState.solcVersions,
      pragmas.join(" ")
    );

    if (solcVersion === null) {
      throw new Error(`No available solc version satisfying ${pragmas}`);
    }

    const contractsToCompile = _.map(dependencyDetails, "path");
    const sources: { [uri: string]: { content: string } } = {};
    for (const contract of contractsToCompile) {
      const contractText =
        openDocs.find((doc) => doc.uri === contract)?.documentText ??
        this.serverState.solFileIndex[contract].text;
      if (contractText === undefined) {
        throw new Error(`Contract not indexed: ${contract}`);
      }
      sources[contract] = { content: contractText };
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

  private async _crawlDependencies(
    sourceUri: string,
    visited: string[] = []
  ): Promise<SolFileDetails[]> {
    if (visited.includes(sourceUri)) {
      return [];
    }

    let text = this.serverState.solFileIndex[sourceUri]?.text;

    if (text === undefined) {
      await analyzeSolFiles(
        1,
        this.serverState,
        new WorkspaceFileRetriever(),
        {},
        [sourceUri]
      );
    }

    text = this.serverState.solFileIndex[sourceUri]?.text;

    if (text === undefined) {
      throw new Error(`Couldnt find/index ${sourceUri}`);
    }

    visited.push(sourceUri);

    // Analyze current file for import strings and pragmas
    const { imports, versionPragmas } = analyze(text);

    // Build list with current file and prepare for dependencies
    const dependencyDetails = [{ path: sourceUri, pragmas: versionPragmas }];

    // Recursively crawl dependencies and append. Skip non-existing imports
    const importsUris = imports.reduce((list, _import) => {
      const resolvedImport = this.project.resolveImportPath(sourceUri, _import);
      if (resolvedImport === undefined) {
        return list;
      } else {
        return list.concat([resolvedImport]);
      }
    }, [] as string[]);

    for (const importUri of importsUris) {
      dependencyDetails.push(
        ...(await this._crawlDependencies(importUri, visited))
      );
    }

    return dependencyDetails;
  }
}
