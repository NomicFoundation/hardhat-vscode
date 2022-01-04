import { Analyzer } from "@analyzer/index";

import { SolidityNavigation } from "@services/navigation/SolidityNavigation";
import { SolidityCompletion } from "@services/completion/SolidityCompletion";
import { SolidityValidation } from "@services/validation/SolidityValidation";
import { compilerProcessFactory } from "@services/validation/compilerProcessFactory";
import { SoliditySignatureHelp } from "@services/documentation/SoliditySignatureHelp";

export class LanguageService {
  analyzer: Analyzer;
  solidityNavigation: SolidityNavigation;
  solidityCompletion: SolidityCompletion;
  solidityValidation: SolidityValidation;
  soliditySignatureHelp: SoliditySignatureHelp;

  constructor(
    rootPath: string,
    compProcessFactory: typeof compilerProcessFactory
  ) {
    this.analyzer = new Analyzer(rootPath);
    this.solidityNavigation = new SolidityNavigation(this.analyzer);
    this.solidityCompletion = new SolidityCompletion(this.analyzer);
    this.solidityValidation = new SolidityValidation(
      this.analyzer,
      compProcessFactory
    );
    this.soliditySignatureHelp = new SoliditySignatureHelp(this.analyzer);
  }
}
