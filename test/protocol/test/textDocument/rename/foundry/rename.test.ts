import { expect } from 'chai'
import { toUri } from '../../../../src/helpers'
import { TestLanguageClient } from '../../../../src/TestLanguageClient'
import { getInitializedClient } from '../../../client'
import { getProjectPath, makePosition, makeRange, runningOnWindows } from '../../../helpers'

let client!: TestLanguageClient

describe('[foundry] rename', () => {
  if (runningOnWindows()) {
    return // skip foundry on windows
  }

  beforeEach(async () => {
    client = await getInitializedClient()
  })

  afterEach(async () => {
    client.closeAllDocuments()
  })

  describe('[single-file][identifier] - rename', function () {
    it('should rename', async () => {
      const documentPath = getProjectPath('foundry/src/rename/Test.sol')
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
