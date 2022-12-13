import { expect } from 'chai'
import { test } from 'mocha'
import { toUri } from '../../../../src/helpers'
import { TestLanguageClient } from '../../../../src/TestLanguageClient'
import { getInitializedClient } from '../../../client'
import { getProjectPath, makePosition, makeRange } from '../../../helpers'

let client!: TestLanguageClient

describe('[hardhat] type definition', () => {
  let testPath: string
  let importedPath: string

  before(async () => {
    client = await getInitializedClient()

    testPath = getProjectPath('hardhat/contracts/typedefinition/Test.sol')
    importedPath = getProjectPath('hardhat/contracts/typedefinition/Imported.sol')

    await client.openDocument(testPath)
    await client.openDocument(importedPath)
  })

  after(async () => {
    client.closeAllDocuments()
  })

  test('[single-file] - go to type definition', async function () {
    const locations = await client.findTypeDefinition(toUri(testPath), makePosition(26, 12))

    expect(locations).to.deep.equal([
      {
        uri: toUri(testPath),
        range: makeRange(9, 11, 9, 16),
      },
    ])
  })

  test('[Single-file][Defined after usage] - Go to Type Definition', async function () {
    const locations = await client.findTypeDefinition(toUri(testPath), makePosition(21, 16))

    expect(locations).to.deep.equal([
      {
        uri: toUri(testPath),
        range: makeRange(53, 11, 53, 19),
      },
    ])
  })

  test('[Single-file][Multi types] - Go to Type Definition', async function () {
    const locations = await client.findTypeDefinition(toUri(testPath), makePosition(38, 25))

    expect(locations).to.deep.equal([
      {
        uri: toUri(testPath),
        range: makeRange(53, 11, 53, 19),
      },
      {
        uri: toUri(testPath),
        range: makeRange(9, 11, 9, 16),
      },
    ])
  })

  test('[Single-file] - Go to balance Type Definition', async function () {
    const locations = await client.findTypeDefinition(toUri(importedPath), makePosition(21, 20))

    expect(locations).to.deep.equal([
      {
        uri: toUri(importedPath),
        range: makeRange(3, 7, 3, 14),
      },
    ])
  })
})
