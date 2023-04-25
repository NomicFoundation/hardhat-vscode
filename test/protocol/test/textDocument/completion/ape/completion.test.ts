import { expect } from 'chai'
import { test } from 'mocha'
import { toUri } from '../../../../src/helpers'
import { TestLanguageClient } from '../../../../src/TestLanguageClient'
import { getInitializedClient } from '../../../client'
import { getProjectPath } from '../../../helpers'

let client!: TestLanguageClient

describe('[ape][completion]', () => {
  beforeEach(async () => {
    client = await getInitializedClient()
  })

  afterEach(async () => {
    client.closeAllDocuments()
  })

  describe('imports', function () {
    test('relative import', async () => {
      const documentPath = getProjectPath('ape/src/completion/A.sol')
      const documentUri = toUri(documentPath)
      await client.openDocument(documentPath)

      const completions = await client.getCompletions(documentUri, 0, 8)

      expect(completions).to.deep.equal({
        isIncomplete: false,
        items: [
          {
            label: './B.sol',
            insertText: './B.sol',
            kind: 17,
            documentation: 'Imports the package',
          },
          {
            label: './nested',
            insertText: './nested',
            kind: 19,
            documentation: 'Imports the package',
          },
        ],
      })
    })
  })
})
