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

  describe('[single-file] - find all implementations', function () {
    it('should should find implementations', async () => {
      const documentPath = getProjectPath('projectless/src/implementation/Test.sol')
      const documentUri = toUri(documentPath)

      client.openDocument(documentPath)

      const positions = await client.findImplementations(documentUri, makePosition(53, 15))

      expect(positions).to.deep.equal([
        {
          uri: documentPath,
          range: makeRange(53, 11, 53, 19),
        },
        {
          uri: documentPath,
          range: makeRange(15, 4, 15, 12),
        },
        {
          uri: documentPath,
          range: makeRange(18, 8, 18, 16),
        },
        {
          uri: documentPath,
          range: makeRange(38, 100, 38, 108),
        },
      ])
    })
  })
})
