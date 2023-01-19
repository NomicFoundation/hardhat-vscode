/* eslint-disable no-template-curly-in-string */
import { expect } from 'chai'
import { test } from 'mocha'
import { CompletionTriggerKind } from 'vscode-languageserver-protocol'
import { toUri } from '../../../../src/helpers'
import { TestLanguageClient } from '../../../../src/TestLanguageClient'
import { getInitializedClient } from '../../../client'
import { getProjectPath } from '../../../helpers'

let client!: TestLanguageClient

describe('[hardhat][completion]', () => {
  beforeEach(async () => {
    client = await getInitializedClient()
  })

  afterEach(async () => {
    client.closeAllDocuments()
  })

  describe('imports', function () {
    test('hardhat import completion on empty', async () => {
      const documentPath = getProjectPath('hardhat/contracts/completion/Imports.sol')
      const documentUri = toUri(documentPath)
      await client.openDocument(documentPath)

      const completions = await client.getCompletions(documentUri, 0, 8)

      expect(completions).to.deep.equal({
        isIncomplete: false,
        items: [
          {
            label: './Globals.sol',
            insertText: './Globals.sol',
            kind: 17,
            documentation: 'Imports the package',
            command: {
              command: 'solidity.insertSemicolon',
              arguments: [
                {
                  line: 0,
                  character: 8,
                },
              ],
              title: '',
            },
          },
          {
            label: './Natspec.sol',
            insertText: './Natspec.sol',
            kind: 17,
            documentation: 'Imports the package',
            command: {
              command: 'solidity.insertSemicolon',
              arguments: [
                {
                  line: 0,
                  character: 8,
                },
              ],
              title: '',
            },
          },
          {
            label: './NatspecSingle.sol',
            insertText: './NatspecSingle.sol',
            kind: 17,
            documentation: 'Imports the package',
            command: {
              command: 'solidity.insertSemicolon',
              arguments: [
                {
                  line: 0,
                  character: 8,
                },
              ],
              title: '',
            },
          },
          {
            label: 'hardhat',
            textEdit: {
              range: {
                start: {
                  line: 0,
                  character: 8,
                },
                end: {
                  line: 0,
                  character: 8,
                },
              },
              newText: 'hardhat',
            },
            kind: 9,
            documentation: 'Imports the package',
            command: {
              command: 'solidity.insertSemicolon',
              arguments: [
                {
                  line: 0,
                  character: 8,
                },
              ],
              title: '',
            },
          },
          {
            label: '@openzeppelin',
            textEdit: {
              range: {
                start: {
                  line: 0,
                  character: 8,
                },
                end: {
                  line: 0,
                  character: 8,
                },
              },
              newText: '@openzeppelin',
            },
            kind: 9,
            documentation: 'Imports the package',
            command: {
              command: 'solidity.insertSemicolon',
              arguments: [
                {
                  line: 0,
                  character: 8,
                },
              ],
              title: '',
            },
          },
        ],
      })
    })

    test('hardhat node_modules contract import completion on partial specification', async () => {
      const documentPath = getProjectPath('hardhat/contracts/completion/Imports.sol')
      const documentUri = toUri(documentPath)
      await client.openDocument(documentPath)

      const completions = await client.getCompletions(documentUri, 2, 16)

      expect(completions).to.deep.equal({
        isIncomplete: false,
        items: [
          {
            label: 'hardhat',
            textEdit: {
              range: {
                start: {
                  line: 2,
                  character: 8,
                },
                end: {
                  line: 2,
                  character: 16,
                },
              },
              newText: 'hardhat',
            },
            kind: 9,
            documentation: 'Imports the package',
            command: {
              command: 'solidity.insertSemicolon',
              arguments: [
                {
                  line: 2,
                  character: 16,
                },
              ],
              title: '',
            },
          },
          {
            label: '@openzeppelin',
            textEdit: {
              range: {
                start: {
                  line: 2,
                  character: 8,
                },
                end: {
                  line: 2,
                  character: 16,
                },
              },
              newText: '@openzeppelin',
            },
            kind: 9,
            documentation: 'Imports the package',
            command: {
              command: 'solidity.insertSemicolon',
              arguments: [
                {
                  line: 2,
                  character: 16,
                },
              ],
              title: '',
            },
          },
        ],
      })
    })

    test('hardhat node_modules contract import completion on module specified', async () => {
      const documentPath = getProjectPath('hardhat/contracts/completion/Imports.sol')
      const documentUri = toUri(documentPath)
      await client.openDocument(documentPath)

      const completions = await client.getCompletions(documentUri, 4, 16)

      expect(completions).to.deep.equal({
        isIncomplete: false,
        items: [
          {
            label: 'hardhat/console.sol',
            textEdit: {
              range: {
                start: {
                  line: 4,
                  character: 8,
                },
                end: {
                  line: 4,
                  character: 16,
                },
              },
              newText: 'hardhat/console.sol',
            },
            kind: 9,
            documentation: 'Imports the package',
            command: {
              command: 'solidity.insertSemicolon',
              arguments: [
                {
                  line: 4,
                  character: 16,
                },
              ],
              title: '',
            },
          },
          {
            label: 'hardhat/sample-projects/basic/contracts/Greeter.sol',
            textEdit: {
              range: {
                start: {
                  line: 4,
                  character: 8,
                },
                end: {
                  line: 4,
                  character: 16,
                },
              },
              newText: 'hardhat/sample-projects/basic/contracts/Greeter.sol',
            },
            kind: 9,
            documentation: 'Imports the package',
            command: {
              command: 'solidity.insertSemicolon',
              arguments: [
                {
                  line: 4,
                  character: 16,
                },
              ],
              title: '',
            },
          },
        ],
      })
    })

    test('hardhat node_modules contract import completion on module and partial contract', async () => {
      const documentPath = getProjectPath('hardhat/contracts/completion/Imports.sol')
      const documentUri = toUri(documentPath)
      await client.openDocument(documentPath)

      const completions = await client.getCompletions(documentUri, 6, 42)

      expect(completions).to.deep.equal({
        isIncomplete: false,
        items: [
          {
            label: '@openzeppelin/contracts/access/Ownable.sol',
            textEdit: {
              range: {
                start: {
                  line: 6,
                  character: 8,
                },
                end: {
                  line: 6,
                  character: 42,
                },
              },
              newText: '@openzeppelin/contracts/access/Ownable.sol',
            },
            kind: 9,
            documentation: 'Imports the package',
            command: {
              command: 'solidity.insertSemicolon',
              arguments: [
                {
                  line: 6,
                  character: 42,
                },
              ],
              title: '',
            },
          },
        ],
      })
    })
  })

  describe('globals', function () {
    describe('abi', function () {
      test('gives completion for all of abi methods', async () => {
        const documentPath = getProjectPath('hardhat/contracts/completion/Globals.sol')
        const documentUri = toUri(documentPath)
        await client.openDocument(documentPath)

        const completions = await client.getCompletions(documentUri, 5, 8, CompletionTriggerKind.TriggerCharacter, '.')

        expect(completions).to.deep.equal({
          isIncomplete: false,
          items: [
            {
              label: 'decode',
              kind: 3,
            },
            {
              label: 'encode',
              kind: 3,
            },
            {
              label: 'encodePacked',
              kind: 3,
            },
            {
              label: 'encodeWithSelector',
              kind: 3,
            },
            {
              label: 'encodeWithSignature',
              kind: 3,
            },
            {
              label: 'encodeCall',
              kind: 3,
            },
          ],
        })
      })
    })
  })

  describe('natspec', function () {
    describe('multi line', function () {
      describe('function natspec', function () {
        test('natspec completion on function with 2 return values, 1 named 1 unnamed', async () => {
          const documentPath = getProjectPath('hardhat/contracts/completion/Natspec.sol')
          const documentUri = toUri(documentPath)
          await client.openDocument(documentPath)

          const completions = await client.getCompletions(
            documentUri,
            15,
            5,
            CompletionTriggerKind.TriggerCharacter,
            '*'
          )

          expect(completions).to.deep.equal({
            isIncomplete: false,
            items: [
              {
                label: 'NatSpec function documentation',
                textEdit: {
                  range: {
                    start: {
                      line: 15,
                      character: 5,
                    },
                    end: {
                      line: 15,
                      character: 5,
                    },
                  },
                  newText: '\n * $0\n * @param a ${1}\n * @param b ${2}\n * @return retVal ${3}\n * @return ${4}\n',
                },
                insertTextFormat: 2,
              },
            ],
          })
        })

        test('natspec completion on function with 1 return value', async () => {
          const documentPath = getProjectPath('hardhat/contracts/completion/Natspec.sol')
          const documentUri = toUri(documentPath)
          await client.openDocument(documentPath)

          const completions = await client.getCompletions(
            documentUri,
            20,
            5,
            CompletionTriggerKind.TriggerCharacter,
            '*'
          )

          expect(completions).to.deep.equal({
            isIncomplete: false,
            items: [
              {
                label: 'NatSpec function documentation',
                textEdit: {
                  range: {
                    start: {
                      line: 20,
                      character: 5,
                    },
                    end: {
                      line: 20,
                      character: 5,
                    },
                  },
                  newText: '\n * $0\n * @param a ${1}\n * @param b ${2}\n',
                },
                insertTextFormat: 2,
              },
            ],
          })
        })

        test('natspec completion on function without return value', async () => {
          const documentPath = getProjectPath('hardhat/contracts/completion/Natspec.sol')
          const documentUri = toUri(documentPath)
          await client.openDocument(documentPath)

          const completions = await client.getCompletions(
            documentUri,
            25,
            5,
            CompletionTriggerKind.TriggerCharacter,
            '*'
          )

          expect(completions).to.deep.equal({
            isIncomplete: false,
            items: [
              {
                label: 'NatSpec function documentation',
                textEdit: {
                  range: {
                    start: {
                      line: 25,
                      character: 5,
                    },
                    end: {
                      line: 25,
                      character: 5,
                    },
                  },
                  newText: '\n * $0\n * @param a ${1}\n',
                },
                insertTextFormat: 2,
              },
            ],
          })
        })
      })

      describe('contract/library/interface natspec', function () {
        test('natspec completion for contract', async () => {
          const documentPath = getProjectPath('hardhat/contracts/completion/Natspec.sol')
          const documentUri = toUri(documentPath)
          await client.openDocument(documentPath)

          const completions = await client.getCompletions(
            documentUri,
            13,
            3,
            CompletionTriggerKind.TriggerCharacter,
            '*'
          )

          expect(completions).to.deep.equal({
            isIncomplete: false,
            items: [
              {
                label: 'NatSpec contract documentation',
                textEdit: {
                  range: {
                    start: {
                      line: 13,
                      character: 3,
                    },
                    end: {
                      line: 13,
                      character: 3,
                    },
                  },
                  newText: '\n * @title $1\n * @author $2\n * @notice $3\n',
                },
                insertTextFormat: 2,
              },
            ],
          })
        })
        test('natspec completion for library', async () => {
          const documentPath = getProjectPath('hardhat/contracts/completion/Natspec.sol')
          const documentUri = toUri(documentPath)
          await client.openDocument(documentPath)

          const completions = await client.getCompletions(
            documentUri,
            3,
            3,
            CompletionTriggerKind.TriggerCharacter,
            '*'
          )

          expect(completions).to.deep.equal({
            isIncomplete: false,
            items: [
              {
                label: 'NatSpec contract documentation',
                textEdit: {
                  range: {
                    start: {
                      line: 3,
                      character: 3,
                    },
                    end: {
                      line: 3,
                      character: 3,
                    },
                  },
                  newText: '\n * @title $1\n * @author $2\n * @notice $3\n',
                },
                insertTextFormat: 2,
              },
            ],
          })
        })
        test('natspec completion for interface', async () => {
          const documentPath = getProjectPath('hardhat/contracts/completion/Natspec.sol')
          const documentUri = toUri(documentPath)
          await client.openDocument(documentPath)

          const completions = await client.getCompletions(
            documentUri,
            8,
            3,
            CompletionTriggerKind.TriggerCharacter,
            '*'
          )

          expect(completions).to.deep.equal({
            isIncomplete: false,
            items: [
              {
                label: 'NatSpec contract documentation',
                textEdit: {
                  range: {
                    start: {
                      line: 8,
                      character: 3,
                    },
                    end: {
                      line: 8,
                      character: 3,
                    },
                  },
                  newText: '\n * @title $1\n * @author $2\n * @notice $3\n',
                },
                insertTextFormat: 2,
              },
            ],
          })
        })
      })

      describe('state variable natspec', function () {
        test('natspec completion on public state variable', async () => {
          const documentPath = getProjectPath('hardhat/contracts/completion/Natspec.sol')
          const documentUri = toUri(documentPath)
          await client.openDocument(documentPath)

          const completions = await client.getCompletions(
            documentUri,
            32,
            5,
            CompletionTriggerKind.TriggerCharacter,
            '*'
          )

          expect(completions).to.deep.equal({
            isIncomplete: false,
            items: [
              {
                label: 'NatSpec variable documentation',
                textEdit: {
                  range: {
                    start: {
                      line: 32,
                      character: 5,
                    },
                    end: {
                      line: 32,
                      character: 5,
                    },
                  },
                  newText: '\n * @notice ${1}\n * @dev ${2}\n',
                },
                insertTextFormat: 2,
              },
            ],
          })
        })

        test('natspec completion on private state variable', async () => {
          const documentPath = getProjectPath('hardhat/contracts/completion/Natspec.sol')
          const documentUri = toUri(documentPath)
          await client.openDocument(documentPath)

          const completions = await client.getCompletions(
            documentUri,
            35,
            5,
            CompletionTriggerKind.TriggerCharacter,
            '*'
          )

          expect(completions).to.deep.equal({
            isIncomplete: false,
            items: [
              {
                label: 'NatSpec variable documentation',
                textEdit: {
                  range: {
                    start: {
                      line: 35,
                      character: 5,
                    },
                    end: {
                      line: 35,
                      character: 5,
                    },
                  },
                  newText: '\n * @dev ${1}\n',
                },
                insertTextFormat: 2,
              },
            ],
          })
        })
      })

      test('natspec completion on event', async () => {
        const documentPath = getProjectPath('hardhat/contracts/completion/Natspec.sol')
        const documentUri = toUri(documentPath)
        await client.openDocument(documentPath)

        const completions = await client.getCompletions(documentUri, 38, 5, CompletionTriggerKind.TriggerCharacter, '*')

        expect(completions).to.deep.equal({
          isIncomplete: false,
          items: [
            {
              label: 'NatSpec event documentation',
              textEdit: {
                range: {
                  start: {
                    line: 38,
                    character: 5,
                  },
                  end: {
                    line: 38,
                    character: 5,
                  },
                },
                newText: '\n * $0\n * @param a ${1}\n * @param b ${2}\n',
              },
              insertTextFormat: 2,
            },
          ],
        })
      })
    })

    describe('single line', function () {
      describe('function natspec', function () {
        test('natspec completion on function with 2 return values', async () => {
          const documentPath = getProjectPath('hardhat/contracts/completion/NatspecSingle.sol')
          const documentUri = toUri(documentPath)
          await client.openDocument(documentPath)

          const completions = await client.getCompletions(
            documentUri,
            5,
            5,
            CompletionTriggerKind.TriggerCharacter,
            '/'
          )

          expect(completions).to.deep.equal({
            isIncomplete: false,
            items: [
              {
                label: 'NatSpec function documentation',
                textEdit: {
                  range: {
                    start: {
                      line: 5,
                      character: 5,
                    },
                    end: {
                      line: 5,
                      character: 5,
                    },
                  },
                  newText: ' $0\n/// @param a ${1}\n/// @param b ${2}\n/// @return retVal ${3}\n/// @return ${4}',
                },
                insertTextFormat: 2,
              },
            ],
          })
        })
      })

      test('natspec completion for contract', async () => {
        const documentPath = getProjectPath('hardhat/contracts/completion/NatspecSingle.sol')
        const documentUri = toUri(documentPath)
        await client.openDocument(documentPath)

        const completions = await client.getCompletions(documentUri, 3, 3, CompletionTriggerKind.TriggerCharacter, '/')

        expect(completions).to.deep.equal({
          isIncomplete: false,
          items: [
            {
              label: 'NatSpec contract documentation',
              textEdit: {
                range: {
                  start: {
                    line: 3,
                    character: 3,
                  },
                  end: {
                    line: 3,
                    character: 3,
                  },
                },
                newText: ' @title $1\n/// @author $2\n/// @notice $3',
              },
              insertTextFormat: 2,
            },
          ],
        })
      })

      test('natspec completion on event', async () => {
        const documentPath = getProjectPath('hardhat/contracts/completion/NatspecSingle.sol')
        const documentUri = toUri(documentPath)
        await client.openDocument(documentPath)

        const completions = await client.getCompletions(documentUri, 15, 5, CompletionTriggerKind.TriggerCharacter, '/')

        expect(completions).to.deep.equal({
          isIncomplete: false,
          items: [
            {
              label: 'NatSpec event documentation',
              textEdit: {
                range: {
                  start: {
                    line: 15,
                    character: 5,
                  },
                  end: {
                    line: 15,
                    character: 5,
                  },
                },
                newText: ' $0\n/// @param a ${1}\n/// @param b ${2}',
              },
              insertTextFormat: 2,
            },
          ],
        })
      })

      test('natspec completion on public state variable', async () => {
        const documentPath = getProjectPath('hardhat/contracts/completion/NatspecSingle.sol')
        const documentUri = toUri(documentPath)
        await client.openDocument(documentPath)

        const completions = await client.getCompletions(documentUri, 12, 5, CompletionTriggerKind.TriggerCharacter, '/')

        expect(completions).to.deep.equal({
          isIncomplete: false,
          items: [
            {
              label: 'NatSpec variable documentation',
              textEdit: {
                range: {
                  start: {
                    line: 12,
                    character: 5,
                  },
                  end: {
                    line: 12,
                    character: 5,
                  },
                },
                newText: ' @notice ${1}\n/// @dev ${2}',
              },
              insertTextFormat: 2,
            },
          ],
        })
      })
    })
  })
})
