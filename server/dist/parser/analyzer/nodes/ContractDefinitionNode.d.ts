import { ContractDefinition, FinderType, DocumentsAnalyzerMap, Node, ContractDefinitionNode as AbstractContractDefinitionNode } from "@common/types";
export declare class ContractDefinitionNode extends AbstractContractDefinitionNode {
    astNode: ContractDefinition;
    connectionTypeRules: string[];
    constructor(contractDefinition: ContractDefinition, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap);
    getKind(): string;
    getTypeNodes(): Node[];
    getDefinitionNode(): Node | undefined;
    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node;
    findParentForOrphanNodesInInheritanceNodes(orphanNodes: Node[]): void;
}
