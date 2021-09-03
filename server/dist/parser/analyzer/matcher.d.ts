import * as astTypes from "@solidity-parser/parser/dist/src/ast-types";
import { Node, DocumentsAnalyzerMap } from "@common/types";
export declare const find: (ast: astTypes.BaseASTNode, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap) => Node;
