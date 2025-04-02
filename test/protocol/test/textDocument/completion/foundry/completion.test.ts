import { expect } from 'chai'
import { test } from 'mocha'
import { shouldSkipFoundryTests, toUri } from '../../../../src/helpers'
import { TestLanguageClient } from '../../../../src/TestLanguageClient'
import { getInitializedClient } from '../../../client'
import { getProjectPath } from '../../../helpers'

let client!: TestLanguageClient

describe('[foundry][completion]', () => {
  if (shouldSkipFoundryTests()) {
    return
  }

  beforeEach(async () => {
    client = await getInitializedClient()
  })

  afterEach(async () => {
    await client.closeAllDocuments()
  })

  describe('imports', function () {
    test('base lib import through remappings', async () => {
      const documentPath = getProjectPath('foundry/src/completion/Imports.sol')
      const documentUri = toUri(documentPath)
      await client.openDocument(documentPath)

      const completions = await client.getCompletions(documentUri, 0, 8)

      expect(completions).to.deep.equal({
        isIncomplete: false,
        items: [
          {
            label: '@lib',
            insertText: '@lib',
            kind: 9,
            documentation: 'Imports the package',
          },
          {
            label: '@myLib',
            insertText: '@myLib',
            kind: 9,
            documentation: 'Imports the package',
          },
          {
            label: '@tmp',
            insertText: '@tmp',
            kind: 9,
            documentation: 'Imports the package',
          },
          {
            label: 'myLib',
            insertText: 'myLib',
            kind: 9,
            documentation: 'Imports the package',
          },
        ],
      })
    })

    test('lib contract import through remappings on partial specification', async () => {
      if (shouldSkipFoundryTests()) {
        return
      }

      const documentPath = getProjectPath('foundry/src/completion/Imports.sol')
      const documentUri = toUri(documentPath)
      await client.openDocument(documentPath)

      const completions = await client.getCompletions(documentUri, 2, 15)

      expect(completions).to.deep.equal({
        isIncomplete: false,
        items: [
          {
            label: 'Imported.sol',
            insertText: 'Imported.sol',
            kind: 17,
            documentation: 'Imports the package',
          },
          {
            label: 'OtherImported.sol',
            insertText: 'OtherImported.sol',
            kind: 17,
            documentation: 'Imports the package',
          },
        ],
      })
    })
  })
})
