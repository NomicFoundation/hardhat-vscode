import { Analyzer } from "@analyzer/index";
import { SolidityNavigation } from '@services/navigation/SolidityNavigation';
import { SolidityCompletion } from '@services/completion/SolidityCompletion';
import { SolidityValidation } from '@services/validation/SolidityValidation';
export declare class LanguageService {
    analyzer: Analyzer;
    solidityNavigation: SolidityNavigation;
    solidityCompletion: SolidityCompletion;
    solidityValidation: SolidityValidation;
    constructor(rootPath: string);
}
