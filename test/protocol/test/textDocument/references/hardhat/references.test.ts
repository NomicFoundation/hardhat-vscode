import { expect } from 'chai'
import { toUri } from '../../../../src/helpers'
import { TestLanguageClient } from '../../../../src/TestLanguageClient'
import { getInitializedClient } from '../../../client'
import { getProjectPath, makePosition, makeRange } from '../../../helpers'

let client!: TestLanguageClient

describe('[hardhat] references', () => {
  beforeEach(async () => {
    client = await getInitializedClient()
  })

  afterEach(async () => {
    client.closeAllDocuments()
  })

  describe('[single-file] - find all references', function () {
    it('should should find references', async () => {
      const documentPath = getProjectPath('hardhat/contracts/references/Test.sol')
      const documentUri = toUri(documentPath)

      await client.openDocument(documentPath)

      const locations = await client.findReferences(documentUri, makePosition(9, 14))

      expect(locations).to.deep.equal([
        {
          uri: documentPath,
          range: makeRange(9, 11, 9, 16),
        },
        {
          uri: documentPath,
          range: makeRange(14, 23, 14, 28),
        },
        {
          uri: documentPath,
          range: makeRange(38, 119, 38, 124),
        },
        {
          uri: documentPath,
          range: makeRange(43, 12, 43, 17),
        },
      ])
    })
  })
})
