import { assert } from 'chai';
import * as path from 'path';
import { VSCodePosition } from '@common/types';
import { OnDefinition, setupMockLanguageServer } from '../../../helpers/setupMockLanguageServer';

describe("Parser", () => {
    describe("Navigation", () => {
        const basicUri = path.join(__dirname, 'testData', 'Basic.sol');
        let definition: OnDefinition;

        before(async () => {
            ({ server: { definition } } = await setupMockLanguageServer({ documents: [basicUri] }));

            // Hack, the anaylsing of text docs is debounced
            await new Promise((resolve, reject) => {
                setTimeout(resolve, 1000);
            });
        });

        describe("within contract", () => {
            it("should navigate to the attribute", () => assertNavigation(definition, basicUri, { line: 19, character: 9 }, {
                start: { line: 11, character: 19 },
                end: { line: 11, character: 26 }
            }));

            it("should navigate to a nested struct attribute", () => assertNavigation(definition, basicUri, { line: 28, character: 14 }, {
                start: { line: 5, character: 16 },
                end: { line: 5, character: 24 }
            }));

            it("should navigate to local function", () => assertNavigation(definition, basicUri, { line: 30, character: 9 }, {
                start: { line: 23, character: 4 },
                end: { line: 25, character: 4 }
            }));

            it("should navigate to type via map property", () => assertNavigation(definition, basicUri, { line: 15, character: 24 }, {
                start: { line: 4, character: 4 },
                end: { line: 9, character: 1 }
            }));

            it("should navigate to type via array declaration", () => assertNavigation(definition, basicUri, { line: 16, character: 5 }, {
                start: { line: 33, character: 4 },
                end: { line: 35, character: 4 }
            }));
        });
    });
});

const assertNavigation = async (definition: OnDefinition, uri: string, position: VSCodePosition, expectedRange: { start: VSCodePosition, end: VSCodePosition }) => {
    const response = await definition({ textDocument: { uri }, position });

    if (!response || Array.isArray(response)) {
        assert.fail();
    }

    assert.exists(response);
    assert.deepStrictEqual(response?.range, expectedRange);
};