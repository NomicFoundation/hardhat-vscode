import { expect } from 'chai'
import { test } from 'mocha'
import { toUri } from '../../../../src/helpers'
import { TestLanguageClient } from '../../../../src/TestLanguageClient'
import { getInitializedClient } from '../../../client'
import { getProjectPath, makePosition, makeRange } from '../../../helpers'

let client!: TestLanguageClient

describe('[hardhat] definition - data-types', () => {
  let dataTypesPath: string

  before(async () => {
    client = await getInitializedClient()
    dataTypesPath = getProjectPath('hardhat/contracts/definition/data-types/DataTypes.sol')

    await client.openDocument(dataTypesPath)
  })

  after(async () => {
    await client.closeAllDocuments()
  })

  test('struct member accessed on a memory parameter', async () => {
    const location = await client.findDefinition(toUri(dataTypesPath), makePosition(25, 17))

    expect(location).to.deep.equal({
      uri: toUri(dataTypesPath),
      range: makeRange(16, 16, 16, 17),
    })
  })

  test('last member in a chained struct member access', async () => {
    const location = await client.findDefinition(toUri(dataTypesPath), makePosition(25, 29))

    expect(location).to.deep.equal({
      uri: toUri(dataTypesPath),
      range: makeRange(12, 16, 12, 17),
    })
  })

  test('struct name in a positional struct constructor', async () => {
    const location = await client.findDefinition(toUri(dataTypesPath), makePosition(37, 25))

    expect(location).to.deep.equal({
      uri: toUri(dataTypesPath),
      range: makeRange(15, 11, 15, 16),
    })
  })

  test('field name in a named-argument struct constructor', async () => {
    const location = await client.findDefinition(toUri(dataTypesPath), makePosition(38, 32))

    expect(location).to.deep.equal({
      uri: toUri(dataTypesPath),
      range: makeRange(16, 16, 16, 17),
    })
  })

  test('enum member', async () => {
    const location = await client.findDefinition(toUri(dataTypesPath), makePosition(51, 22))

    expect(location).to.deep.equal({
      uri: toUri(dataTypesPath),
      range: makeRange(7, 8, 7, 11),
    })
  })

  test('enum name in type(E).max', async () => {
    const location = await client.findDefinition(toUri(dataTypesPath), makePosition(51, 49))

    expect(location).to.deep.equal({
      uri: toUri(dataTypesPath),
      range: makeRange(6, 9, 6, 14),
    })
  })
})
