import { Analyzer } from "@analyzer/index";
import { TextDocument, Diagnostic } from "@common/types";
export declare class SolidityValidation {
    analyzer: Analyzer;
    constructor(analyzer: Analyzer);
    doValidation(uri: string, document: TextDocument): Promise<{
        [uri: string]: Diagnostic[];
    }>;
    private getHardhatRuntimeEnvironment;
}
