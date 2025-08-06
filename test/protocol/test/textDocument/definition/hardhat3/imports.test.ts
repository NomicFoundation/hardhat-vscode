import { expect } from 'chai'
import { test } from 'mocha'
import { toUri } from '../../../../src/helpers'
import { TestLanguageClient } from '../../../../src/TestLanguageClient'
import { getInitializedClient } from '../../../client'
import { getProjectPath, makePosition, makeRange } from '../../../helpers'

let client!: TestLanguageClient

describe('[hardhat3] definition - all import cases', () => {
  before(async () => {
    client = await getInitializedClient()
  })

  after(async () => {
    await client.closeAllDocuments()
  })

  describe('from local file', function () {
    test('to local file through relative import', async () => {
      const localFilePath = getProjectPath('hardhat3/contracts/definition/imports/Local1.sol')
      await client.openDocument(localFilePath)

      const location = await client.findDefinition(toUri(localFilePath), makePosition(7, 5))

      expect(location).to.deep.equal({
        uri: toUri(getProjectPath('hardhat3/contracts/definition/imports/Local2.sol')),
        range: makeRange(5, 9, 5, 15),
      })
    })

    test('to local file through remapping', async () => {
      const localFilePath = getProjectPath('hardhat3/contracts/definition/imports/Local1.sol')
      await client.openDocument(localFilePath)

      const location = await client.findDefinition(toUri(localFilePath), makePosition(9, 5))

      expect(location).to.deep.equal({
        uri: toUri(getProjectPath('hardhat3/contracts/definition/imports/Local4.sol')),
        range: makeRange(3, 9, 3, 15),
      })
    })

    test('to npm package (without exports) through direct import', async () => {
      const localFilePath = getProjectPath('hardhat3/contracts/definition/imports/Local2.sol')
      await client.openDocument(localFilePath)

      const location = await client.findDefinition(toUri(localFilePath), makePosition(6, 2))

      expect(location).to.deep.equal({
        uri: toUri(getProjectPath('hardhat3/node_modules/pkg_without_exports_1/src/A.sol')),
        range: makeRange(7, 9, 7, 10),
      })
    })

    test('to npm package (without exports) through remappings', async () => {
      const localFilePath = getProjectPath('hardhat3/contracts/definition/imports/Local2.sol')
      await client.openDocument(localFilePath)

      const location = await client.findDefinition(toUri(localFilePath), makePosition(7, 2))

      expect(location).to.deep.equal({
        uri: toUri(getProjectPath('hardhat3/node_modules/pkg_without_exports_2/src/B.sol')),
        range: makeRange(3, 9, 3, 10),
      })
    })

    test('to npm package (with exports) through direct import', async () => {
      const localFilePath = getProjectPath('hardhat3/contracts/definition/imports/Local3.sol')
      await client.openDocument(localFilePath)

      const location = await client.findDefinition(toUri(localFilePath), makePosition(7, 2))

      expect(location).to.deep.equal({
        uri: toUri(getProjectPath('hardhat3/node_modules/pkg_with_exports_1/src/C.sol')),
        range: makeRange(6, 9, 6, 10),
      })
    })

    test('to npm package (with exports) through remappings', async () => {
      const localFilePath = getProjectPath('hardhat3/contracts/definition/imports/Local3.sol')
      await client.openDocument(localFilePath)

      const location = await client.findDefinition(toUri(localFilePath), makePosition(8, 2))

      expect(location).to.deep.equal({
        uri: toUri(getProjectPath('hardhat3/node_modules/pkg_with_exports_2/src/D.sol')),
        range: makeRange(3, 9, 3, 10),
      })
    })
  })

  describe('from npm package', function () {
    test('to same package through relative import', async () => {
      const npmFilePath = getProjectPath('hardhat3/node_modules/pkg_without_exports_1/src/A.sol')
      await client.openDocument(npmFilePath)

      const location = await client.findDefinition(toUri(npmFilePath), makePosition(8, 2))

      expect(location).to.deep.equal({
        uri: toUri(getProjectPath('hardhat3/node_modules/pkg_without_exports_1/src/A2.sol')),
        range: makeRange(3, 9, 3, 11),
      })
    })

    test('to same package using remappings', async () => {
      const npmFilePath = getProjectPath('hardhat3/node_modules/pkg_without_exports_1/src/A.sol')
      await client.openDocument(npmFilePath)

      const location = await client.findDefinition(toUri(npmFilePath), makePosition(9, 2))

      expect(location).to.deep.equal({
        uri: toUri(getProjectPath('hardhat3/node_modules/pkg_without_exports_1/src/A3.sol')),
        range: makeRange(3, 9, 3, 11),
      })
    })

    test('to other npm package (without exports) through direct import', async () => {
      const npmFilePath = getProjectPath('hardhat3/node_modules/pkg_with_exports_1/src/C.sol')
      await client.openDocument(npmFilePath)

      const location = await client.findDefinition(toUri(npmFilePath), makePosition(7, 2))

      expect(location).to.deep.equal({
        uri: toUri(getProjectPath('hardhat3/node_modules/pkg_without_exports_1/src/A.sol')),
        range: makeRange(7, 9, 7, 10),
      })
    })

    test('to other npm package (with exports) through direct import', async () => {
      const npmFilePath = getProjectPath('hardhat3/node_modules/pkg_with_exports_1/src/C.sol')
      await client.openDocument(npmFilePath)

      const location = await client.findDefinition(toUri(npmFilePath), makePosition(8, 2))

      expect(location).to.deep.equal({
        uri: toUri(getProjectPath('hardhat3/node_modules/pkg_with_exports_2/src/D.sol')),
        range: makeRange(3, 9, 3, 10),
      })
    })

    test('to other npm package (without exports) using remappings', async () => {
      const npmFilePath = getProjectPath('hardhat3/node_modules/pkg_without_exports_1/src/A.sol')
      await client.openDocument(npmFilePath)

      const location = await client.findDefinition(toUri(npmFilePath), makePosition(10, 2))

      expect(location).to.deep.equal({
        uri: toUri(getProjectPath('hardhat3/node_modules/pkg_without_exports_2/src/B.sol')),
        range: makeRange(3, 9, 3, 10),
      })
    })
  })
})
