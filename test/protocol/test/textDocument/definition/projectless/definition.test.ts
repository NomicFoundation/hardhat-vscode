import { expect } from 'chai'
import { toUri } from '../../../../src/helpers'
import { TestLanguageClient } from '../../../../src/TestLanguageClient'
import { getInitializedClient } from '../../../client'
import { getProjectPath, makePosition, makeRange } from '../../../helpers'

let client!: TestLanguageClient

describe('[projectless] definition', () => {
  beforeEach(async () => {
    client = await getInitializedClient()
  })

  afterEach(async () => {
    client.closeAllDocuments()
  })

  describe('[single-file] - go to definition', function () {
    it('should go to definition', async () => {
      const documentPath = getProjectPath('projectless/src/definition/Test.sol')
      const documentUri = toUri(documentPath)

      await client.openDocument(documentPath)

      const location = await client.findDefinition(documentUri, makePosition(14, 25))

      expect(location).to.deep.equal({
        uri: toUri(documentPath),
        range: makeRange(9, 11, 9, 16),
      })
    })
  })
})
