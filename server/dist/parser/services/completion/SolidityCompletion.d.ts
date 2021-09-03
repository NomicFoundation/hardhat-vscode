import { Analyzer } from "@analyzer/index";
import { VSCodePosition, CompletionList, DocumentAnalyzer } from "@common/types";
export declare class SolidityCompletion {
    analyzer: Analyzer;
    constructor(analyzer: Analyzer);
    doComplete(rootPath: string, position: VSCodePosition, documentAnalyzer: DocumentAnalyzer): CompletionList;
    private getThisCompletions;
    private getSuperCompletions;
    private getGlobalVariableCompletions;
    private getImportPathCompletion;
    private getMemberAccessCompletions;
    private getDefaultCompletions;
    private getCompletionsFromFiles;
    private getCompletionsFromNodes;
    private getTypeName;
    private findNodeByPosition;
    private isNodePosition;
    private findContractDefinition;
}
