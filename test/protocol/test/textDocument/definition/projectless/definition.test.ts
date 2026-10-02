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
    await client.closeAllDocuments()
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

  describe('[single-file][inheritance] - private member of a base contract', function () {
    const documentPath = getProjectPath('projectless/src/inheritance/PrivateBaseMember.sol')
    const documentUri = toUri(documentPath)

    beforeEach(async () => {
      await client.openDocument(documentPath)
    })

    it('should skip the private member and go to the inherited one', async () => {
      const location = await client.findDefinition(documentUri, makePosition(25, 9))

      expect(location).to.deep.equal({
        uri: documentUri,
        range: makeRange(12, 33, 12, 35),
      })
    })

    it('should go to a member accessed through the inherited one', async () => {
      const location = await client.findDefinition(documentUri, makePosition(25, 12))

      expect(location).to.deep.equal({
        uri: documentUri,
        range: makeRange(4, 13, 4, 18),
      })
    })

    it('should go to the private member from within its own contract', async () => {
      const location = await client.findDefinition(documentUri, makePosition(19, 16))

      expect(location).to.deep.equal({
        uri: documentUri,
        range: makeRange(16, 36, 16, 38),
      })
    })
  })

  describe('[single-file][inheritance] - member of an inherited interface', function () {
    it('should go to a member declared on a base interface of the type', async () => {
      const documentPath = getProjectPath('projectless/src/inheritance/InheritedInterfaceMember.sol')
      const documentUri = toUri(documentPath)

      await client.openDocument(documentPath)

      const location = await client.findDefinition(documentUri, makePosition(15, 12))

      expect(location).to.deep.equal({
        uri: documentUri,
        range: makeRange(4, 13, 4, 18),
      })
    })
  })

  describe('[multi-file][inheritance] - base contract in another file', function () {
    it('should not resolve to a local variable of a function in the other file', async () => {
      const basePath = getProjectPath('projectless/src/inheritance/OtherFileBase.sol')
      const documentPath = getProjectPath('projectless/src/inheritance/OtherFileScope.sol')
      const documentUri = toUri(documentPath)

      await client.openDocument(basePath)
      await client.openDocument(documentPath)

      const location = await client.findDefinition(documentUri, makePosition(11, 9))

      expect(location).to.deep.equal({
        uri: documentUri,
        range: makeRange(6, 21, 6, 23),
      })
    })
  })
})
