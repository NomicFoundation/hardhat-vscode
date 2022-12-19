import { expect } from 'chai'
import { test } from 'mocha'
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
    test('hardhat node_modules contract import completion on empty', async () => {
      const documentPath = getProjectPath('hardhat/contracts/completion/Imports.sol')
      const documentUri = toUri(documentPath)
      await client.openDocument(documentPath)

      const completions = await client.getCompletions(documentUri, 0, 8)

      expect(completions).to.deep.equal({
        isIncomplete: false,
        items: [
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
              command: 'hardhat.solidity.insertSemicolon',
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
              command: 'hardhat.solidity.insertSemicolon',
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
              command: 'hardhat.solidity.insertSemicolon',
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
              command: 'hardhat.solidity.insertSemicolon',
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
              command: 'hardhat.solidity.insertSemicolon',
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
              command: 'hardhat.solidity.insertSemicolon',
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
              command: 'hardhat.solidity.insertSemicolon',
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
})
