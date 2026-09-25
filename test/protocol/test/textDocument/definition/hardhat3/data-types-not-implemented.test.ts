import { expect } from 'chai'
import { test } from 'mocha'
import { toUri } from '../../../../src/helpers'
import { TestLanguageClient } from '../../../../src/TestLanguageClient'
import { getInitializedClient } from '../../../client'
import { getProjectPath, makePosition, makeRange } from '../../../helpers'

let client!: TestLanguageClient

describe('[hardhat3] definition - data-types (not implemented)', () => {
  let dataTypesPath: string
  let registryPath: string

  before(async () => {
    client = await getInitializedClient()
    dataTypesPath = getProjectPath('hardhat3/contracts/definition/data-types/DataTypes.sol')
    registryPath = getProjectPath('hardhat3/contracts/definition/data-types/Registry.sol')

    await client.openDocument(dataTypesPath)
    await client.openDocument(registryPath)
  })

  after(async () => {
    await client.closeAllDocuments()
  })

  // Not implemented: returns null.
  test.skip('struct member through a nested mapping', async () => {
    const location = await client.findDefinition(toUri(dataTypesPath), makePosition(29, 37))

    expect(location).to.deep.equal({
      uri: toUri(dataTypesPath),
      range: makeRange(16, 16, 16, 17),
    })
  })

  // Not implemented: returns null.
  test.skip('struct member on the result of push()', async () => {
    const location = await client.findDefinition(toUri(dataTypesPath), makePosition(33, 22))

    expect(location).to.deep.equal({
      uri: toUri(dataTypesPath),
      range: makeRange(16, 16, 16, 17),
    })
  })

  // Not implemented: returns null.
  test.skip('struct member on the value a function returns', async () => {
    const location = await client.findDefinition(toUri(dataTypesPath), makePosition(43, 23))

    expect(location).to.deep.equal({
      uri: toUri(dataTypesPath),
      range: makeRange(16, 16, 16, 17),
    })
  })

  // Not implemented: returns null.
  test.skip('struct of another contract in a qualified type name', async () => {
    const location = await client.findDefinition(toUri(dataTypesPath), makePosition(55, 17))

    expect(location).to.deep.equal({
      uri: toUri(registryPath),
      range: makeRange(9, 11, 9, 16),
    })
  })

  // Not implemented: returns null.
  test.skip('enum member of another contract through C.E.A', async () => {
    const location = await client.findDefinition(toUri(dataTypesPath), makePosition(55, 63))

    expect(location).to.deep.equal({
      uri: toUri(registryPath),
      range: makeRange(6, 8, 6, 11),
    })
  })

  // Not implemented: returns null.
  test.skip('member of a struct declared in another contract', async () => {
    const location = await client.findDefinition(toUri(dataTypesPath), makePosition(56, 17))

    expect(location).to.deep.equal({
      uri: toUri(registryPath),
      range: makeRange(10, 13, 10, 17),
    })
  })
})
