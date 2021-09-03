"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LanguageService = void 0;
const index_1 = require("@analyzer/index");
const SolidityNavigation_1 = require("@services/navigation/SolidityNavigation");
const SolidityCompletion_1 = require("@services/completion/SolidityCompletion");
const SolidityValidation_1 = require("@services/validation/SolidityValidation");
class LanguageService {
    constructor(rootPath) {
        this.analyzer = new index_1.Analyzer(rootPath);
        this.solidityNavigation = new SolidityNavigation_1.SolidityNavigation(this.analyzer);
        this.solidityCompletion = new SolidityCompletion_1.SolidityCompletion(this.analyzer);
        this.solidityValidation = new SolidityValidation_1.SolidityValidation(this.analyzer);
    }
}
exports.LanguageService = LanguageService;
//# sourceMappingURL=index.js.map