import { Analyzer } from "@analyzer/index";
import { TextDocument, VSCodePosition, VSCodeLocation, WorkspaceEdit, Node } from "@common/types";
export declare class SolidityNavigation {
    analyzer: Analyzer;
    constructor(analyzer: Analyzer);
    findDefinition(uri: string, position: VSCodePosition, analyzerTree: Node): VSCodeLocation | undefined;
    findTypeDefinition(uri: string, position: VSCodePosition, analyzerTree: Node): VSCodeLocation[];
    findReferences(uri: string, position: VSCodePosition, analyzerTree: Node): VSCodeLocation[];
    findImplementation(uri: string, position: VSCodePosition, analyzerTree: Node): VSCodeLocation[];
    doRename(uri: string, document: TextDocument, position: VSCodePosition, newName: string, analyzerTree: Node): WorkspaceEdit;
    private getHighlightLocations;
    private findHighlightNodes;
    private findNodeByPosition;
    private extractHighlightsFromNodeRecursive;
}
