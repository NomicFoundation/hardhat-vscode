"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCircularReplacer = void 0;
function getCircularReplacer() {
    const seen = new WeakSet();
    return (key, value) => {
        if (typeof value === "object" && value !== null) {
            if (seen.has(value)) {
                return;
            }
            seen.add(value);
        }
        return value;
    };
}
exports.getCircularReplacer = getCircularReplacer;
;
//# sourceMappingURL=utils.js.map