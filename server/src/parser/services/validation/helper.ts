'use strict';

(async () => {
    // TypeScript forces to check send method on existence
    if (process.send) {
        const data: any = await new Promise(resolve => {
			process.on('message', (parentData: any) => {
				resolve(parentData);
			});
		});

        let hre;
        const uri: string = data.uri;
        const documentText: string = data.documentText;
        const unsavedDocuments: { uri: string, documentText: string }[] = data.unsavedDocuments;

        try {
            hre = require('hardhat');
        } catch (err) {
            // Hardhat is not installed
            // console.error(err);
            hre = undefined;
        }

        if (!hre) {
            process.send({});
            process.exit(1);
        }

        const {
            TASK_COMPILE_SOLIDITY_GET_SOURCE_PATHS,
            TASK_COMPILE_SOLIDITY_GET_SOURCE_NAMES,
            TASK_COMPILE_SOLIDITY_GET_DEPENDENCY_GRAPH,
            TASK_COMPILE_SOLIDITY_GET_COMPILATION_JOB_FOR_FILE,
            TASK_COMPILE_SOLIDITY_GET_COMPILER_INPUT,
            TASK_COMPILE_SOLIDITY_COMPILE
        } = require("hardhat/builtin-tasks/task-names");

        const {
            getSolidityFilesCachePath,
            SolidityFilesCache,
        } = require("hardhat/builtin-tasks/utils/solidity-files-cache");

        const sourcePaths = await hre.run(TASK_COMPILE_SOLIDITY_GET_SOURCE_PATHS);

        const sourceNames = await hre.run(TASK_COMPILE_SOLIDITY_GET_SOURCE_NAMES, {
            sourcePaths,
        });

        const solidityFilesCachePath = getSolidityFilesCachePath(hre.config.paths);
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
            [uri]: documentText
        };

        for (const unsavedDocument of unsavedDocuments) {
            modifiedFiles[unsavedDocument.uri] = unsavedDocument.documentText;
        }

        compilationJob.getResolvedFiles()
            .forEach((file: any) => {
                if (modifiedFiles[file.absolutePath]) {
                    file.content.rawContent = modifiedFiles[file.absolutePath];
                }
            });

        const input = await hre.run(
            TASK_COMPILE_SOLIDITY_GET_COMPILER_INPUT,
            {
                compilationJob,
            }
        );

        const { output } = await hre.run(TASK_COMPILE_SOLIDITY_COMPILE, {
            solcVersion: compilationJob.getSolcConfig().version,
            input,
            quiet: true,
            compilationJob,
            compilationJobs: [compilationJob],
            compilationJobIndex: 0,
        });

        process.send(output);
    }
})();