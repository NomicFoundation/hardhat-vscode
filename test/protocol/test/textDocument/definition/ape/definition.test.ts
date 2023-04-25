import { expect } from 'chai'
import { toUri } from '../../../../src/helpers'
import { TestLanguageClient } from '../../../../src/TestLanguageClient'
import { getInitializedClient } from '../../../client'
import { getProjectPath, makePosition, makeRange } from '../../../helpers'

let client!: TestLanguageClient

describe('[ape] definition', () => {
  beforeEach(async () => {
    client = await getInitializedClient()
  })

  afterEach(async () => {
    client.closeAllDocuments()
  })

  describe('[versioned dependency] - go to definition', function () {
    it('should go to definition', async () => {
      const documentPath = getProjectPath('ape/src/ImportsOZ.sol')
      const documentUri = toUri(documentPath)

      const importedPath = getProjectPath('ape/src/.cache/OpenZeppelin/v4.4.2/access/Ownable.sol')

      await client.openDocument(documentPath)

      const location = await client.findDefinition(documentUri, makePosition(11, 21))

      expect(location).to.deep.equal({
        uri: toUri(importedPath),
        range: makeRange(19, 18, 19, 25),
      })
    })
  })

  describe('[branch dependency] - go to definition', function () {
    it('should go to definition', async () => {
      const documentPath = getProjectPath('ape/src/ImportsDapptools.sol')
      const documentUri = toUri(documentPath)

      const importedPath = getProjectPath('ape/src/.cache/DappToolsERC20/dappnix/erc20.sol')

      await client.openDocument(documentPath)

      const location = await client.findDefinition(documentUri, makePosition(9, 21))

      expect(location).to.deep.equal({
        uri: toUri(importedPath),
        range: makeRange(18, 9, 18, 14),
      })
    })
  })

  describe('[local dependency] - go to definition', function () {
    it('should go to definition', async () => {
      const documentPath = getProjectPath('ape/src/ImportsOZLocal.sol')
      const documentUri = toUri(documentPath)

      const importedPath = getProjectPath('ape/src/.cache/LocalOZ/local/access/Ownable.sol')

      await client.openDocument(documentPath)

      const location = await client.findDefinition(documentUri, makePosition(8, 21))

      expect(location).to.deep.equal({
        uri: toUri(importedPath),
        range: makeRange(19, 18, 19, 25),
      })
    })
  })
})
