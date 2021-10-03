import * as path from "path";
import * as childProcess from "child_process";

import * as utils from "@common/utils";
import { Analyzer } from "@analyzer/index";
import { TextDocument, Diagnostic, Range, DiagnosticSeverity } from "@common/types";

export class SolidityValidation {
	analyzer: Analyzer;

	constructor(analyzer: Analyzer) {
		this.analyzer = analyzer;
	}

	public async doValidation(uri: string, document: TextDocument, unsavedDocuments: TextDocument[]): Promise<{ [uri: string]: Diagnostic[] }> {
		const projectRoot = utils.findUpSync("package.json", {
			cwd: path.resolve(uri, ".."),
			stopAt: this.analyzer.rootPath
		});

		const child = childProcess.fork(
			path.resolve(__dirname, "helper.js"),
			{ cwd: projectRoot }
		);

		child.send({
			uri,
			documentText: document.getText(),
			unsavedDocuments: unsavedDocuments.map(unsavedDocument => {
				return {
					uri: (unsavedDocument.uri as any).path,
					documentText: unsavedDocument.getText()
				};
			})
		});

		const output: any = await new Promise(resolve => {
			child.on('message', (output: any) => {
				resolve(output);
			});
		});

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
	}
}
