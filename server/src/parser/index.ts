import { Analyzer } from "@analyzer/index";

import { SolidityNavigation } from "@services/navigation/SolidityNavigation";
import { SolidityCompletion } from "@services/completion/SolidityCompletion";
import { SolidityValidation } from "@services/validation/SolidityValidation";
import { SoliditySignatureHelp } from "@services/documentation/SoliditySignatureHelp";

export class LanguageService {
  analyzer: Analyzer;
  solidityNavigation: SolidityNavigation;
  solidityCompletion: SolidityCompletion;
  solidityValidation: SolidityValidation;
  soliditySignatureHelp: SoliditySignatureHelp;

  constructor(rootPath: string) {
    this.analyzer = new Analyzer(rootPath);
    this.solidityNavigation = new SolidityNavigation(this.analyzer);
    this.solidityCompletion = new SolidityCompletion(this.analyzer);
    this.solidityValidation = new SolidityValidation(this.analyzer);
    this.soliditySignatureHelp = new SoliditySignatureHelp(this.analyzer);
  }
}
