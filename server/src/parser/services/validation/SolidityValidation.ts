import * as path from "path";
import * as childProcess from "child_process";

import * as utils from "@common/utils";
import { Analyzer } from "@analyzer/index";
import { TextDocument, Diagnostic, Range, DiagnosticSeverity } from "@common/types";

export interface ValidationJob {
	run(uri: string, document: TextDocument, unsavedDocuments: TextDocument[]): Promise<{ [uri: string]: Diagnostic[] }>;
	kill(): void;
}

export const GET_DOCUMENT_EVENT = "get_document";
export const SOLIDITY_COMPILE_CONFIRMATION_EVENT = "solidity_compile_confirmation";

export const COMPILER_DOWNLOADED_EVENT = "compiler_downloaded";
export const SOLIDITY_COMPILE_EVENT = "solidity_compile";
export const HARDHAT_CONFIG_FILE_EXIST_EVENT = "hardhat_config_file_exist";

export class SolidityValidation {
	analyzer: Analyzer;

	constructor(analyzer: Analyzer) {
		this.analyzer = analyzer;
	}

	public getValidationJob(uri: string): ValidationJob {
		let isCompilerDownloaded = true;

		const projectRoot = utils.findUpSync("package.json", {
			cwd: path.resolve(uri, ".."),
			stopAt: this.analyzer.rootPath
		});

		const child = childProcess.fork(
			path.resolve(__dirname, "helper.js"),
			{ cwd: projectRoot }
		);


		let hardhatConfigFileExistPromiseResolver: any;
		const hardhatConfigFileExistPromise = new Promise(resolve => { hardhatConfigFileExistPromiseResolver = resolve; });

		let compilerDownloadedPromiseResolver: any;
		const compilerDownloadedPromise = new Promise(resolve => { compilerDownloadedPromiseResolver = resolve; });

		let solidityCompilePromiseResolver: any;
		const solidityCompilePromise = new Promise(resolve => { solidityCompilePromiseResolver = resolve; });

		child.on("message", (data: any) => {
			switch (data.type) {
				case HARDHAT_CONFIG_FILE_EXIST_EVENT:
					hardhatConfigFileExistPromiseResolver(data.exist);
					break;
				
				case COMPILER_DOWNLOADED_EVENT:
					compilerDownloadedPromiseResolver(data.isCompilerDownloaded);
					break;
			
				case SOLIDITY_COMPILE_EVENT:
					solidityCompilePromiseResolver(data.output);
					break;

				default:
					break;
			}
		});

		return {
			run: async (uri: string, document: TextDocument, unsavedDocuments: TextDocument[]): Promise<{ [uri: string]: Diagnostic[] }> => {
				child.send({
					type: GET_DOCUMENT_EVENT,
					data: {
						uri,
						documentText: document.getText(),
						unsavedDocuments: unsavedDocuments.map(unsavedDocument => {
							return {
								uri: (unsavedDocument.uri as any).path,
								documentText: unsavedDocument.getText()
							};
						})
					}
				});

				const hardhatConfigFileExist = (await hardhatConfigFileExistPromise) as boolean;
				if (!hardhatConfigFileExist) {
					return {};
				}

				isCompilerDownloaded = (await compilerDownloadedPromise) as boolean;
				child.send({ type: SOLIDITY_COMPILE_CONFIRMATION_EVENT });

				const output: any = await solidityCompilePromise;

				const diagnostics: { [uri: string]: Diagnostic[] } = {};
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
			},

			kill: async () => {
				if (!isCompilerDownloaded) {
					return;
				}

				child.kill();

			}
		} as ValidationJob;
	}
}
