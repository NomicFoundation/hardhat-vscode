import { expect } from 'chai'
import { toUri } from '../../../../src/helpers'
import { TestLanguageClient } from '../../../../src/TestLanguageClient'
import { getInitializedClient } from '../../../client'
import { getProjectPath, makePosition } from '../../../helpers'

let client!: TestLanguageClient

describe('[projectless] hover', () => {
  beforeEach(async () => {
    client = await getInitializedClient()
  })

  afterEach(async () => {
    await client.closeAllDocuments()
  })

  describe('[single-file][inheritance] - private member of a base contract', function () {
    it('should describe a member accessed through the inherited one', async () => {
      const documentPath = getProjectPath('projectless/src/inheritance/PrivateBaseMember.sol')
      const documentUri = toUri(documentPath)

      await client.openDocument(documentPath)

      const hover = await client.getHover(documentUri, makePosition(25, 12))

      expect(hover).to.deep.equal({
        contents: {
          kind: 'markdown',
          value: '```solidity\nfunction prank(address sender) external\n```',
        },
      })
    })
  })
})
