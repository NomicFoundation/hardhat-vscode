"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.debounce = exports.decodeUriAndRemoveFilePrefix = exports.getUriFromDocument = void 0;
function getUriFromDocument(document) {
    return decodeUriAndRemoveFilePrefix(document.uri);
}
exports.getUriFromDocument = getUriFromDocument;
function decodeUriAndRemoveFilePrefix(uri) {
    if (uri && uri.includes('file://')) {
        uri = uri.replace("file://", "");
    }
    if (uri) {
        uri = decodeURIComponent(uri);
    }
    return uri;
}
exports.decodeUriAndRemoveFilePrefix = decodeUriAndRemoveFilePrefix;
function debounce(func, timeoutInMilliseconds) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => {
            func(...args);
        }, timeoutInMilliseconds);
    };
}
exports.debounce = debounce;
//# sourceMappingURL=index.js.map