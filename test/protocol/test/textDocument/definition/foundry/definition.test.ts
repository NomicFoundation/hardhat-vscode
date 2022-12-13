import { expect } from 'chai'
import { test } from 'mocha'
import { toUri } from '../../../../src/helpers'
import { TestLanguageClient } from '../../../../src/TestLanguageClient'
import { getInitializedClient } from '../../../client'
import { getProjectPath, makePosition, makeRange, runningOnWindows } from '../../../helpers'

let client!: TestLanguageClient

describe('[foundry] definition', () => {
  if (runningOnWindows()) {
    return // skip foundry on windows
  }

  let testPath: string
  let importerPath: string
  let importedPath: string
  let otherImportedPath: string

  before(async () => {
    client = await getInitializedClient()
    testPath = getProjectPath('foundry/src/definition/Test.sol')
    importerPath = getProjectPath('foundry/src/definition/Importer.sol')
    importedPath = getProjectPath('foundry/lib/myLib/Imported.sol')
    otherImportedPath = getProjectPath('foundry/lib/myLib/OtherImported.sol')

    await client.openDocument(testPath)
    await client.openDocument(importerPath)
  })

  after(async () => {
    client.closeAllDocuments()
  })

  test('[single-file] - go to definition', async function () {
    const location = await client.findDefinition(toUri(testPath), makePosition(14, 25))

    expect(location).to.deep.equal({
      uri: toUri(testPath),
      range: makeRange(9, 11, 9, 16),
    })
  })

  test('[multi-file][remappings] - go to Imported.sol via import line', async function () {
    const location = await client.findDefinition(toUri(importerPath), makePosition(4, 22))

    expect(location).to.deep.equal({
      uri: toUri(importedPath),
      range: makeRange(2, 0, 9, 0),
    })
  })

  test('[multi-file][remappings] - go to OtherImported.sol via import line', async function () {
    const location = await client.findDefinition(toUri(importerPath), makePosition(5, 22))

    expect(location).to.deep.equal({
      uri: toUri(otherImportedPath),
      range: makeRange(2, 0, 9, 0),
    })
  })

  test('[multi-file][remappings] - go to Imported.sol via declaration line', async function () {
    const location = await client.findDefinition(toUri(importerPath), makePosition(8, 5))

    expect(location).to.deep.equal({
      uri: toUri(importedPath),
      range: makeRange(4, 9, 4, 17),
    })
  })

  test('[multi-file][remappings] - go to OtherImported.sol via declaration line', async function () {
    const location = await client.findDefinition(toUri(importerPath), makePosition(9, 5))

    expect(location).to.deep.equal({
      uri: toUri(otherImportedPath),
      range: makeRange(4, 9, 4, 22),
    })
  })
})
