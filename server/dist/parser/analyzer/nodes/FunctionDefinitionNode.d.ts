import { FunctionDefinition, FinderType, DocumentsAnalyzerMap, Node, FunctionDefinitionNode as IFunctionDefinitionNode } from "@common/types";
export declare class FunctionDefinitionNode extends IFunctionDefinitionNode {
    astNode: FunctionDefinition;
    connectionTypeRules: string[];
    constructor(functionDefinition: FunctionDefinition, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap);
    getDefinitionNode(): Node | undefined;
    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node;
    private findChildren;
}
