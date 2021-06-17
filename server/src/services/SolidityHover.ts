import { Node } from "@nodes/Node";

import { TextDocument, Position, Hover, HoverSettings } from '../types/languageTypes';

export class SolidityHover {
	private defaultSettings?: HoverSettings;

	public configure(settings: HoverSettings | undefined) {
		this.defaultSettings = settings;
	}

	public doHover(document: TextDocument, position: Position, analyzerTree: Node, settings = this.defaultSettings): Hover | undefined {
        // TO-DO: Implement doHover
        return undefined;
    }
}
