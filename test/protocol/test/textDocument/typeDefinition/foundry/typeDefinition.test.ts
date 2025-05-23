import { expect } from 'chai'
import { shouldSkipFoundryTests, toUri } from '../../../../src/helpers'
import { TestLanguageClient } from '../../../../src/TestLanguageClient'
import { getInitializedClient } from '../../../client'
import { getProjectPath, makePosition, makeRange } from '../../../helpers'

let client!: TestLanguageClient

describe('[foundry] type definition', () => {
  if (shouldSkipFoundryTests()) {
    return
  }

  beforeEach(async () => {
    client = await getInitializedClient()
  })

  afterEach(async () => {
    await client.closeAllDocuments()
  })

  describe('[single-file] - go to type definition', function () {
    it('should go to type definition', async () => {
      const documentPath = getProjectPath('foundry/src/typedefinition/Test.sol')
      const documentUri = toUri(documentPath)

      await client.openDocument(documentPath)

      const locations = await client.findTypeDefinition(documentUri, makePosition(26, 12))

      expect(locations).to.deep.equal([
        {
          uri: toUri(documentPath),
          range: makeRange(9, 11, 9, 16),
        },
      ])
    })
  })
})
