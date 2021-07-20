


import { AssemblyLocalDefinition, FinderType, DocumentsAnalyzerMap, Node } from "@common/types";

export class AssemblyLocalDefinitionNode extends Node {
    astNode: AssemblyLocalDefinition;

    connectionTypeRules: string[] = [ "AssemblyCall", "Identifier" ];

    constructor (
        assemblyLocalDefinition: AssemblyLocalDefinition,
        uri: string,
        rootPath: string,
        documentsAnalyzer: DocumentsAnalyzerMap,
        parent?: Node,
        identifierNode?: Node
    ) {
        super(assemblyLocalDefinition, uri, rootPath, documentsAnalyzer, undefined);
        this.astNode = assemblyLocalDefinition;

        if (parent && identifierNode) {
            this.setParent(parent);
    
            this.nameLoc = identifierNode.nameLoc;
            this.name = identifierNode.getName();
    
            parent.addChild(this);
        }
    }

    getTypeNodes(): Node[] {
        return this.typeNodes;
    }

    getDefinitionNode(): Node | undefined {
        return this;
    }

    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node {
        this.setExpressionNode(expression);
        
        for (const name of this.astNode.names || []) {
            const identifierNode = find(name, this.uri, this.rootPath, this.documentsAnalyzer).accept(find, orphanNodes, this, this);

            new AssemblyLocalDefinitionNode(this.astNode, identifierNode.uri, identifierNode.rootPath, identifierNode.documentsAnalyzer, parent, identifierNode);
        }

        if (this.astNode.expression) {
            find(this.astNode.expression, this.uri, this.rootPath, this.documentsAnalyzer).accept(find, orphanNodes, parent);
        }

        return this;
    }
}
