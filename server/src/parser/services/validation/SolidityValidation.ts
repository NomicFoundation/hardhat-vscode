import { Analyzer } from "@analyzer/index";
import {
	TextDocument, Diagnostic, DiagnosticSeverity, Range
} from "@common/types";

export class SolidityValidation {
	analyzer: Analyzer

	constructor(analyzer: Analyzer) {
		this.analyzer = analyzer;
	}

	public async doValidation(uri: string, document: TextDocument): Promise<{ [uri: string]: Diagnostic[] }> {
		const diagnostics: { [uri: string]: Diagnostic[] } = {};

		const hre = this.getHardhatRuntimeEnvironment();
		if (hre === undefined) {
			return Promise.resolve({});
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
			[uri]: document.getText()
		};

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

		if (output?.errors && output.errors.length > 0) {
			for (const error of output.errors) {
				if (!diagnostics[error.sourceLocation.file]) {
					diagnostics[error.sourceLocation.file] = [];
				}

				diagnostics[error.sourceLocation.file].push(<Diagnostic>{
					code: error.errorCode,
					source: document.languageId,
					severity: error.severity === "error" ? DiagnosticSeverity.Error : DiagnosticSeverity.Warning,
					message: error.message,
					range: Range.create(
						document.positionAt(error.sourceLocation.start),
						document.positionAt(error.sourceLocation.end)
					)
				});
			}
		}

		return diagnostics;
	}

	private getHardhatRuntimeEnvironment() {
		try {
			return require("hardhat");
		} catch (err) {
			// Hardhat is not installed
			console.error(err);
			return undefined;
		}
	}
}
