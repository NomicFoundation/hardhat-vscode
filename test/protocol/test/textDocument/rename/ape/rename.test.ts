import { expect } from 'chai'
import { toUri } from '../../../../src/helpers'
import { TestLanguageClient } from '../../../../src/TestLanguageClient'
import { getInitializedClient } from '../../../client'
import { getProjectPath, makePosition, makeRange } from '../../../helpers'

let client!: TestLanguageClient

describe('[ape] rename', () => {
  beforeEach(async () => {
    client = await getInitializedClient()
  })

  afterEach(async () => {
    await client.closeAllDocuments()
  })

  describe('[single-file][identifier] - rename', function () {
    it('should rename', async () => {
      const documentPath = getProjectPath('ape/src/rename/Test.sol')
      const documentUri = toUri(documentPath)

      await client.openDocument(documentPath)

      const workspaceEdit = await client.rename(documentUri, makePosition(21, 17), 'newName')

      expect(workspaceEdit).to.deep.equal({
        changes: {
          [toUri(documentPath)]: [
            {
              range: makeRange(15, 22, 15, 31),
              newText: 'newName',
            },
            {
              range: makeRange(21, 12, 21, 21),
              newText: 'newName',
            },
            {
              range: makeRange(50, 15, 50, 24),
              newText: 'newName',
            },
            {
              range: makeRange(50, 25, 50, 34),
              newText: 'newName',
            },
          ],
        },
      })
    })
  })
})
