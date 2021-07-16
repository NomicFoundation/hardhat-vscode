import "module-alias/register";

import { Analyzer } from "@analyzer/index";

import { SolidityNavigation } from '@services/navigation/SolidityNavigation';
import { SolidityCompletion } from '@services/completion/SolidityCompletion';

export class LanguageService {
	analyzer: Analyzer;
	solidityNavigation: SolidityNavigation;
	solidityCompletion: SolidityCompletion;

	constructor(rootPath: string) {
		this.analyzer = new Analyzer(rootPath);
		this.solidityNavigation = new SolidityNavigation(this.analyzer);
		this.solidityCompletion = new SolidityCompletion(this.analyzer);
	}
}
