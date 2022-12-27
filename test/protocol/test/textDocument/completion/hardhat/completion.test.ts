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
    test('natspec completion on function with return value', async () => {
      const documentPath = getProjectPath('hardhat/contracts/completion/Natspec.sol')
      const documentUri = toUri(documentPath)
      await client.openDocument(documentPath)

      const completions = await client.getCompletions(documentUri, 4, 5, CompletionTriggerKind.TriggerCharacter, '*')

      expect(completions).to.deep.equal({
        isIncomplete: false,
        items: [
          {
            label: 'NatSpec documentation',
            textEdit: {
              range: {
                start: {
                  line: 4,
                  character: 5,
                },
                end: {
                  line: 4,
                  character: 5,
                },
              },
              newText:
                '\n * @dev Function description\n * @param a parameter description\n * @param b parameter description\n * @return return value description\n',
            },
          },
        ],
      })
    })
  })

  test('natspec completion on function without return value', async () => {
    const documentPath = getProjectPath('hardhat/contracts/completion/Natspec.sol')
    const documentUri = toUri(documentPath)
    await client.openDocument(documentPath)

    const completions = await client.getCompletions(documentUri, 9, 5, CompletionTriggerKind.TriggerCharacter, '*')

    expect(completions).to.deep.equal({
      isIncomplete: false,
      items: [
        {
          label: 'NatSpec documentation',
          textEdit: {
            range: {
              start: {
                line: 9,
                character: 5,
              },
              end: {
                line: 9,
                character: 5,
              },
            },
            newText: '\n * @dev Function description\n * @param a parameter description\n',
          },
        },
      ],
    })
  })
})
