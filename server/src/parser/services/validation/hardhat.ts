"use strict";

import * as path from "path";

export const GET_DOCUMENT_EVENT = "get_document";
export const SOLIDITY_COMPILE_CONFIRMATION_EVENT =
  "solidity_compile_confirmation";

export const COMPILER_DOWNLOADED_EVENT = "compiler_downloaded";
export const SOLIDITY_COMPILE_EVENT = "solidity_compile";
export const HARDHAT_CONFIG_FILE_EXIST_EVENT = "hardhat_config_file_exist";

(async () => {
  try {
    // TypeScript forces to check send method on existence
    if (process.send) {
      let getDocumentPromisePromiseResolver: any;
      const getDocumentPromisePromise = new Promise((resolve) => {
        getDocumentPromisePromiseResolver = resolve;
      });

      let solidityCompileConfirmationPromiseResolver: any;
      const solidityCompileConfirmationPromise = new Promise((resolve) => {
        solidityCompileConfirmationPromiseResolver = resolve;
      });

      process.on("message", (data: any) => {
        switch (data.type) {
          case GET_DOCUMENT_EVENT:
            getDocumentPromisePromiseResolver(data.data);
            break;

          case SOLIDITY_COMPILE_CONFIRMATION_EVENT:
            solidityCompileConfirmationPromiseResolver(data);
            break;

          default:
            break;
        }
      });

      const data: any = await getDocumentPromisePromise;

      let hre;
      const uri: string = data.uri;
      const documentText: string = data.documentText;
      const unsavedDocuments: {uri: string; documentText: string}[] =
        data.unsavedDocuments;

      let hardhatBase = "";
      try {
        hardhatBase = path.resolve(
          require.resolve("hardhat", {paths: [process.cwd()]}),
          "..",
          "..",
          ".."
        );
        require(`${hardhatBase}/register.js`);
        hre = require(`${hardhatBase}/internal/lib/hardhat-lib.js`);
      } catch (err) {
        // Hardhat is not installed
        // console.error("Hardhat Error:", err);
        hre = undefined;
      }

      if (!hre) {
        process.send({type: HARDHAT_CONFIG_FILE_EXIST_EVENT, exist: false});
        process.exit(1);
      }
      process.send({type: HARDHAT_CONFIG_FILE_EXIST_EVENT, exist: true});

      const {
        TASK_COMPILE_SOLIDITY_GET_SOURCE_PATHS,
        TASK_COMPILE_SOLIDITY_GET_SOURCE_NAMES,
        TASK_COMPILE_SOLIDITY_GET_DEPENDENCY_GRAPH,
        TASK_COMPILE_SOLIDITY_GET_COMPILATION_JOB_FOR_FILE,
        TASK_COMPILE_SOLIDITY_GET_COMPILER_INPUT,
        TASK_COMPILE_SOLIDITY_COMPILE,
      } = require(`${hardhatBase}/builtin-tasks/task-names`);

      const {
        getSolidityFilesCachePath,
        SolidityFilesCache,
      } = require(`${hardhatBase}/builtin-tasks/utils/solidity-files-cache`);

      const sourcePaths = await hre.run(TASK_COMPILE_SOLIDITY_GET_SOURCE_PATHS);

      const sourceNames = await hre.run(
        TASK_COMPILE_SOLIDITY_GET_SOURCE_NAMES,
        {
          sourcePaths,
        }
      );

      const solidityFilesCachePath = getSolidityFilesCachePath(
        hre.config.paths
      );
      const solidityFilesCache = await SolidityFilesCache.readFromFile(
        solidityFilesCachePath
      );

      const dependencyGraph = await hre.run(
        TASK_COMPILE_SOLIDITY_GET_DEPENDENCY_GRAPH,
        {
          sourceNames,
          solidityFilesCache,
        }
      );

      const resolvedFile = dependencyGraph
        .getResolvedFiles()
        .filter((f: any) => f.absolutePath === uri)[0];

      const compilationJob = await hre.run(
        TASK_COMPILE_SOLIDITY_GET_COMPILATION_JOB_FOR_FILE,
        {
          file: resolvedFile,
          dependencyGraph,
          solidityFilesCache,
        }
      );

      const modifiedFiles = {
        [uri]: documentText,
      };

      for (const unsavedDocument of unsavedDocuments) {
        modifiedFiles[unsavedDocument.uri] = unsavedDocument.documentText;
      }

      compilationJob.getResolvedFiles().forEach((file: any) => {
        if (modifiedFiles[file.absolutePath]) {
          file.content.rawContent = modifiedFiles[file.absolutePath];
        }
      });

      const input = await hre.run(TASK_COMPILE_SOLIDITY_GET_COMPILER_INPUT, {
        compilationJob,
      });

      const {
        getCompilersDir,
      } = require(`${hardhatBase}/internal/util/global-dir`);
      const {
        CompilerDownloader,
      } = require(`${hardhatBase}/internal/solidity/compiler/downloader`);

      const compilersCache = await getCompilersDir();
      const downloader = new CompilerDownloader(compilersCache);

      const solcVersion = compilationJob.getSolcConfig().version;
      const isCompilerDownloaded = await downloader.isCompilerDownloaded(
        solcVersion
      );
      process.send({type: COMPILER_DOWNLOADED_EVENT, isCompilerDownloaded});
      await solidityCompileConfirmationPromise;

      // download solc version and compile files
      const {output} = await hre.run(TASK_COMPILE_SOLIDITY_COMPILE, {
        solcVersion: solcVersion,
        input,
        quiet: true,
        compilationJob,
        compilationJobs: [compilationJob],
        compilationJobIndex: 0,
      });

      process.send({type: SOLIDITY_COMPILE_EVENT, output});
      process.exit(0);
    }
  } catch (err) {
    process.exit(1);
  }
})();
