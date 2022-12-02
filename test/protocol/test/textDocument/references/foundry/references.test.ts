import { expect } from 'chai'
import { toUri } from '../../../../src/helpers'
import { TestLanguageClient } from '../../../../src/TestLanguageClient'
import { getInitializedClient } from '../../../client'
import { getProjectPath, makePosition, makeRange } from '../../../helpers'

let client!: TestLanguageClient

describe('[foundry] references', () => {
  beforeEach(async () => {
    client = await getInitializedClient()
  })

  describe('[single-file] - find all references', function () {
    it('should should find references', async () => {
      const documentPath = getProjectPath('foundry/src/references/Test.sol')
      const documentUri = toUri(documentPath)

      client.openDocument(documentPath)

      const positions = await client.findReferences(documentUri, makePosition(9, 14))

      expect(positions).to.deep.equal([
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
