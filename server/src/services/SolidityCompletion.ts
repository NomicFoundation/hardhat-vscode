import { Node } from "../../../parser/out/analyzer/nodes/Node";

import { TextDocument, Position, CompletionList } from '../types/languageTypes';

export class SolidityCompletion {

    public doComplete(document: TextDocument, position: Position, analyzerTree: Node): CompletionList {
        // TO-DO: Implement doHover
        return {
            isIncomplete: true,
            items: []
        };
    }
}
