import { expect } from 'chai'
import { shouldSkipFoundryTests, toUri } from '../../../../src/helpers'
import { TestLanguageClient } from '../../../../src/TestLanguageClient'
import { getInitializedClient } from '../../../client'
import { getProjectPath, makePosition, makeRange } from '../../../helpers'

let client!: TestLanguageClient

describe('[foundry] references', () => {
  if (shouldSkipFoundryTests()) {
    return
  }

  beforeEach(async () => {
    client = await getInitializedClient()
  })

  afterEach(async () => {
    await client.closeAllDocuments()
  })

  describe('[single-file] - find all references', function () {
    it('should should find references', async () => {
      const documentPath = getProjectPath('foundry/src/references/Test.sol')
      const documentUri = toUri(documentPath)

      await client.openDocument(documentPath)

      const locations = await client.findReferences(documentUri, makePosition(9, 14))

      expect(locations).to.deep.equal([
        {
          uri: toUri(documentPath),
          range: makeRange(9, 11, 9, 16),
        },
        {
          uri: toUri(documentPath),
          range: makeRange(14, 23, 14, 28),
        },
        {
          uri: toUri(documentPath),
          range: makeRange(38, 119, 38, 124),
        },
        {
          uri: toUri(documentPath),
          range: makeRange(43, 12, 43, 17),
        },
      ])
    })
  })
})
