import { AssemblySwitch, FinderType, DocumentsAnalyzerMap, Node } from "@common/types";
export declare class AssemblySwitchNode extends Node {
    astNode: AssemblySwitch;
    constructor(assemblySwitch: AssemblySwitch, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap);
    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node;
}
