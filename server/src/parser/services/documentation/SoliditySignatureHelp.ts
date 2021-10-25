import { Analyzer } from "@analyzer/index";

import {
    VSCodePosition, DocumentAnalyzer, Position, Node,
    TextDocument, SignatureHelp, SignatureInformation,
    ParameterInformation
} from "@common/types";
import { isCharacterALetter, isCharacterANumber } from "../../../utils";

type DeclarationSignature = {
	declarationNodePosition: Position,
	activeParameter: number,
}; 

export class SoliditySignatureHelp {
    analyzer: Analyzer

	constructor(analyzer: Analyzer) {
		this.analyzer = analyzer;
	}

    public doSignatureHelp(document: TextDocument, vsCodePosition: VSCodePosition, documentAnalyzer: DocumentAnalyzer): SignatureHelp | undefined {
        if (!documentAnalyzer.document) {
            return undefined;
        }

        const analyzerTree = documentAnalyzer.analyzerTree.tree;

        const declarationSignature = this.getDeclarationSignature(vsCodePosition, document);
        if (!declarationSignature) {
            return undefined;
        }

		const definitionNode = documentAnalyzer.searcher.findDefinitionNodeByPosition(
            documentAnalyzer.uri,
            declarationSignature.declarationNodePosition,
            analyzerTree
        );
        if (!definitionNode) {
            return undefined;
        }

        const definitionSignature = this.getDefinitionSignature(definitionNode);
        if (!definitionSignature) {
            return undefined;
        }

        return {
            signatures: [ definitionSignature ],
            activeSignature: null,
            activeParameter: declarationSignature.activeParameter
        };
    }

    private getDeclarationSignature(vsCodePosition: VSCodePosition, document: TextDocument): DeclarationSignature | undefined {
        let activeParameter = 0;
        let declarationNodePosition!: Position;

        const offsetDocument = document.getText().substring(0, document.offsetAt(vsCodePosition));
        for (let i = offsetDocument.length - 1; i >= 0; i--) {
            const char = offsetDocument.charAt(i);
            
            if (char === ';' || char === '}') {
                return undefined;
            }

            if (char === ',') {
                activeParameter++;
                continue;
            }

            if (char === '(') {
                declarationNodePosition = this.findDeclarationNodePosition(i, offsetDocument);
                break;
            }
        }

        return {
            declarationNodePosition,
            activeParameter
        };
    }

    private getDefinitionSignature(definitionNode: Node): SignatureInformation | undefined {
        if (definitionNode.type === 'FunctionDefinition') {
            return this.getFunctionDefinitionSignature(definitionNode);
        }

        return undefined;
    }

    private getFunctionDefinitionSignature(functionDefinitionNode: Node): SignatureInformation | undefined {
        const documentAnalyzer = functionDefinitionNode.documentsAnalyzer[functionDefinitionNode.uri];
        const document = documentAnalyzer?.document;
        const nameLoc = functionDefinitionNode.nameLoc;

        if (!document || !nameLoc) {
            return undefined;
        }

        const offset = this.getOffsetFromPosition(nameLoc.start, document);

        const documentation = this.getDefinitionNodeDocumentation(document, offset);

        let functionSignature = `function ${document.substring(offset).split('{')[0]}`;
        functionSignature = functionSignature.split(';')[0];

        const functionSignatureSplited = functionSignature.split('(');
        const stringParameters = functionSignatureSplited[1].split(')')[0];

        let argumentOffset = functionSignatureSplited[0].length + 1;

        const parameters: ParameterInformation[] = [];
        for (const stringParameter of stringParameters.split(',')) {
            if (stringParameter === '') {
                break;
            }

            parameters.push({
                label: [argumentOffset, argumentOffset + stringParameter.length]
            });

            argumentOffset += stringParameter.length + 1;
        }

        return {
            label: functionSignature,
            documentation,
            parameters
        };
    }

    private getDefinitionNodeDocumentation(document: string, limit: number): string | undefined {
        const newDocument = document.substring(0, limit);
        const documentLines = newDocument.split('\n');
        let documentation = '';
        let isMultiLineComments = false;

        // documentLines.length - 2. Because last element in the documentLines is the node definition,
        // and we are looking one line above for the documentation.
        for (let i = documentLines.length - 2; i >= 0; i--) {
            const documentLine = documentLines[i];
            
            const trimmedLine = documentLine.trim();
            if (!isMultiLineComments && trimmedLine[0] === '/' && trimmedLine[1] === '/') {
                let singleComment = '//';
                if (trimmedLine[2] === '/') {
                    singleComment = '///';
                }

                // Remove comment prefix
                const prettyDocumentLine = documentLine.split(singleComment, 2)[1];
                documentation = (prettyDocumentLine + '\n') + documentation;
                continue;
            }
            if (trimmedLine[0] === '*' && trimmedLine[1] === '/') {
                isMultiLineComments = true;
                continue;
            }
            if (isMultiLineComments && trimmedLine[0] === '*') {
                // Remove comment prefix
                const prettyDocumentLine = documentLine.split('*', 2)[1];
                documentation = (prettyDocumentLine + '\n') + documentation;
                continue;
            }
            
            break;
        }

        // Remove last new line
        return documentation.slice(0, -1);
    }

    private findDeclarationNodePosition(offset: number, document: string): Position {
        let i;
        for (i = offset - 1; i >= 0; i--) {
            const char = document.charAt(i);
            
            if (isCharacterALetter(char) || isCharacterANumber(char)) {
                break;
            }
        }

        return this.getPositionFromOffset(i + 1, document);
    }

    private getOffsetFromPosition(position: Position, document: string): number {
        let offset = 0;
        const documentLines = document.split('\n');

        for (let i = 0; i < documentLines.length; i++) {
            const documentLine = documentLines[i];

            if (position.line - 1 === i) {
                return offset + position.column;
            }

            offset += documentLine.length + 1;
        }

        return offset;
    }

    private getPositionFromOffset(offset: number, document: string): Position {
        const documentLines = document.split('\n');

        let line = 1;
        let column = offset;
        for (let i = 0; i < documentLines.length; i++) {
            const documentLineLength = documentLines[i].length + 1;

            if (column <= documentLineLength) {
                break;
            }

            column -= documentLineLength;
            line++;
        }

        return {
            line,
            column
        };
    }
}
