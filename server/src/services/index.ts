import { Analyzer } from "solidity-analyzer";

import { SolidityNavigation } from './navigation/SolidityNavigation';
import { SolidityCompletion } from './completion/SolidityCompletion';

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
