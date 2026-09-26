import { expect } from 'chai'
import { test } from 'mocha'
import { toUri } from '../../../../src/helpers'
import { TestLanguageClient } from '../../../../src/TestLanguageClient'
import { getInitializedClient } from '../../../client'
import { getProjectPath, makePosition, makeRange } from '../../../helpers'

let client!: TestLanguageClient

describe('[hardhat3] definition - import-forms', () => {
  let importerPath: string
  let libPath: string
  let otherPath: string
  let deepPath: string

  before(async () => {
    client = await getInitializedClient()
    importerPath = getProjectPath('hardhat3/contracts/definition/import-forms/Importer.sol')
    libPath = getProjectPath('hardhat3/contracts/definition/import-forms/Lib.sol')
    otherPath = getProjectPath('hardhat3/contracts/definition/import-forms/Other.sol')
    deepPath = getProjectPath('hardhat3/contracts/definition/import-forms/Deep.sol')

    await client.openDocument(importerPath)
    await client.openDocument(libPath)
    await client.openDocument(otherPath)
    await client.openDocument(deepPath)
  })

  after(async () => {
    await client.closeAllDocuments()
  })

  test('contract imported by name, at a use site', async () => {
    const location = await client.findDefinition(toUri(importerPath), makePosition(10, 5))

    expect(location).to.deep.equal({
      uri: toUri(libPath),
      range: makeRange(16, 9, 16, 14),
    })
  })

  test('contract name inside the import braces', async () => {
    const location = await client.findDefinition(toUri(importerPath), makePosition(3, 9))

    expect(location).to.deep.equal({
      uri: toUri(libPath),
      range: makeRange(16, 9, 16, 14),
    })
  })

  test('aliased import at a use site goes to the original contract', async () => {
    const location = await client.findDefinition(toUri(importerPath), makePosition(11, 5))

    expect(location).to.deep.equal({
      uri: toUri(otherPath),
      range: makeRange(3, 9, 3, 14),
    })
  })

  test('original name inside aliased import braces, colliding with another import', async () => {
    const location = await client.findDefinition(toUri(importerPath), makePosition(4, 9))

    expect(location).to.deep.equal({
      uri: toUri(otherPath),
      range: makeRange(3, 9, 3, 14),
    })
  })

  test('alias name inside the import braces goes to the original contract', async () => {
    const location = await client.findDefinition(toUri(importerPath), makePosition(4, 18))

    expect(location).to.deep.equal({
      uri: toUri(otherPath),
      range: makeRange(3, 9, 3, 14),
    })
  })

  test('contract reached through a transitive plain import', async () => {
    const location = await client.findDefinition(toUri(importerPath), makePosition(13, 5))

    expect(location).to.deep.equal({
      uri: toUri(deepPath),
      range: makeRange(3, 9, 3, 13),
    })
  })
})
