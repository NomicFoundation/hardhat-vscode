/* eslint-disable @typescript-eslint/no-explicit-any */
// import type {
//   ResolvedFile,
//   Resolver,
// } from "hardhat3/types/solidity" with { "resolution-mode": "import" };
import type { ResolvedFile } from "hardhat3/types/solidity" with { "resolution-mode": "import" };
// import path from "node:path";
import { AsyncMutex } from "./AsyncMutex";

interface Dependency {
  importPath: string;
  fileAbsPath: string;
}

export class LSPDependencyGraph {
  #files = new Map<string, ResolvedFile>(); // key is abs path
  #dependencies = new Map<string, Set<Dependency>>();
  #dependants = new Map<string, Set<Dependency>>();

  #unresolvedImports = new Map<string, Set<string>>();

  #mutex = new AsyncMutex();

  #getResolver: () => Promise<any>;

  constructor(getResolver: () => Promise<any>) {
    this.#getResolver = getResolver;
  }

  // Should be called when opening a file. This will index the file and dependencies recursively
  public async walkFile(absPath: string) {
    return this.#mutex.exclusiveRun(async () => {
      const resolver = await this.#getResolver();

      const filesToProcess: ResolvedFile[] = [];

      const resolvedFile = await resolver.resolveProjectFile(absPath);

      this.#addFile(resolvedFile);
      filesToProcess.push(resolvedFile);

      let fileToProcess;

      while ((fileToProcess = filesToProcess.pop()) !== undefined) {
        for (const importPath of fileToProcess.content.importPaths) {
          try {
            const importedFile = await resolver.resolveImport(
              fileToProcess,
              importPath
            );

            if (!this.#hasFile(importedFile)) {
              filesToProcess.push(importedFile);
            }

            this.#addDependency(fileToProcess, importedFile, importPath);
            this.#addDependant(fileToProcess, importedFile, importPath);
          } catch (error) {
            if (!this.#unresolvedImports.has(fileToProcess.fsPath)) {
              this.#unresolvedImports.set(fileToProcess.fsPath, new Set());
            }
            this.#unresolvedImports.get(fileToProcess.fsPath)?.add(importPath);
          }
        }
      }

      return resolvedFile;
    });
  }

  // Should be called when deleting a file (i.e. file deleted event)
  public async deleteFile(absPath: string) {
    return this.#mutex.exclusiveRun(async () => {
      // Remove this file from dependants' dependencies
      for (const dependant of this.#dependants.get(absPath) ?? []) {
        const dependantDependencies =
          this.#dependencies.get(dependant.fileAbsPath) ?? new Set();
        for (const dependency of dependantDependencies) {
          if (
            dependency.fileAbsPath === absPath &&
            dependency.importPath === dependant.importPath
          ) {
            dependantDependencies.delete(dependency);

            // This will now be an unresolved import
            if (!this.#unresolvedImports.has(dependant.fileAbsPath)) {
              this.#unresolvedImports.set(dependant.fileAbsPath, new Set());
            }
            this.#unresolvedImports
              .get(dependant.fileAbsPath)
              ?.add(dependant.importPath);
          }
        }
      }

      // Remove this file from dependencies' dependants
      for (const dependency of this.#dependencies.get(absPath) ?? []) {
        const dependencyDependants =
          this.#dependants.get(dependency.fileAbsPath) ?? new Set();
        for (const dependant of dependencyDependants) {
          if (
            dependant.fileAbsPath === absPath &&
            dependant.importPath === dependency.importPath
          ) {
            dependencyDependants.delete(dependant);
          }
        }
      }

      // Remove this file's dependencies and dependants
      this.#dependencies.delete(absPath);
      this.#dependants.delete(absPath);

      // Remove this file's potential unresolved imports
      this.#unresolvedImports.delete(absPath);

      // Remove this file from the graph
      this.#files.delete(absPath);
    });
  }

  // Should be called when a new file is created (i.e. file created event)
  public async addNewFile(newFileAbsPath: string) {
    return this.#mutex.exclusiveRun(async () => {
      // Check if there were unresolved imports that resolve to this new file
      const resolver = await this.#getResolver();

      for (const [
        unresolvedAbsPath,
        unresolvedImportPaths,
      ] of this.#unresolvedImports.entries()) {
        const potentialDependant = this.#files.get(unresolvedAbsPath);

        if (potentialDependant === undefined) {
          this.#unresolvedImports.delete(unresolvedAbsPath);
          continue;
        }

        for (const importPath of unresolvedImportPaths) {
          try {
            const importedFile = await resolver.resolveImport(
              potentialDependant,
              importPath
            );

            if (importedFile.fsPath === newFileAbsPath) {
              this.#unresolvedImports
                .get(unresolvedAbsPath)
                ?.delete(importPath);

              this.#addDependency(potentialDependant, importedFile, importPath);
              this.#addDependant(potentialDependant, importedFile, importPath);
            }
          } catch (error) {
            continue;
          }
        }
      }
    });
  }

  public resolveImport(from: string, importPath: string): string | undefined {
    for (const dependency of this.#dependencies.get(from) ?? []) {
      if (dependency.importPath === importPath) {
        return dependency.fileAbsPath;
      }
    }
  }

  // public debug() {
  //     console.log();

  //     for (const file of this.#files.values()) {
  //       console.log(`File ${path.basename(file.fsPath)} (${file.fsPath})`);

  //       for (const dependency of this.#dependencies.get(file.fsPath) ?? []) {
  //         console.log(
  //           `  Dependency ${path.basename(dependency.fileAbsPath)} (${dependency.importPath})`
  //         );
  //       }

  //       for (const dependant of this.#dependants.get(file.fsPath) ?? []) {
  //         console.log(
  //           `  Dependant ${path.basename(dependant.fileAbsPath)} (${dependant.importPath})`
  //         );
  //       }
  //     }
  //     for (const [absPath, importPaths] of this.#unresolvedImports) {
  //       for (const importPath of importPaths) {
  //         console.log(
  //           `Unresolved import ${path.basename(absPath)} (${importPath})`
  //         );
  //       }
  //     }
  //   }

  #addFile(file: ResolvedFile): void {
    this.#files.set(file.fsPath, file);
    this.#dependencies.set(file.fsPath, new Set());
    this.#dependants.set(file.fsPath, new Set());
  }

  #addDependency(
    from: ResolvedFile,
    to: ResolvedFile,
    importPath: string
  ): void {
    const dependencies = this.#dependencies.get(from.fsPath);

    if (dependencies === undefined) {
      throw new Error(`Dependencies for ${from.fsPath} not found`);
    }

    if (!this.#hasFile(to)) {
      this.#addFile(to);
    }

    for (const dependency of dependencies) {
      if (
        dependency.fileAbsPath === to.fsPath &&
        dependency.importPath === importPath
      ) {
        return;
      }
    }

    dependencies.add({ importPath, fileAbsPath: to.fsPath });
  }

  #addDependant(
    from: ResolvedFile,
    to: ResolvedFile,
    importPath: string
  ): void {
    const dependants = this.#dependants.get(to.fsPath);

    if (dependants === undefined) {
      throw new Error(`Dependants for ${to.fsPath} not found`);
    }

    for (const dependant of dependants) {
      if (
        dependant.fileAbsPath === from.fsPath &&
        dependant.importPath === importPath
      ) {
        return;
      }
    }

    dependants.add({ importPath, fileAbsPath: from.fsPath });
  }

  #hasFile(file: ResolvedFile): boolean {
    return this.#files.has(file.fsPath);
  }
}
