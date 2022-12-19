import { expect } from 'chai'
import { toUri } from '../../../../src/helpers'
import { TestLanguageClient } from '../../../../src/TestLanguageClient'
import { getInitializedClient } from '../../../client'
import { getProjectPath, makePosition, makeRange } from '../../../helpers'

let client!: TestLanguageClient

describe('[projectless] implementation', () => {
  beforeEach(async () => {
    client = await getInitializedClient()
  })

  afterEach(async () => {
    client.closeAllDocuments()
  })

  describe('[single-file] - find all implementations', function () {
    it('should should find implementations', async () => {
      const documentPath = getProjectPath('projectless/src/implementation/Test.sol')
      const documentUri = toUri(documentPath)

      await client.openDocument(documentPath)

      const locations = await client.findImplementations(documentUri, makePosition(53, 15))

      expect(locations).to.deep.equal([
        {
          uri: toUri(documentPath),
          range: makeRange(53, 11, 53, 19),
        },
        {
          uri: toUri(documentPath),
          range: makeRange(15, 4, 15, 12),
        },
        {
          uri: toUri(documentPath),
          range: makeRange(18, 8, 18, 16),
        },
        {
          uri: toUri(documentPath),
          range: makeRange(38, 100, 38, 108),
        },
      ])
    })
  })
})
