import { expect } from 'chai'
import { test } from 'mocha'
import { Location } from 'vscode-languageserver-protocol'
import { shouldSkipFoundryTests, toUri } from '../../../../src/helpers'
import { TestLanguageClient } from '../../../../src/TestLanguageClient'
import { getInitializedClient } from '../../../client'
import { getProjectPath, makePosition, makeRange } from '../../../helpers'

let client!: TestLanguageClient

// References come in no particular order: compare them as sets.
function sorted(locations: Location[]) {
  return [...locations].sort(
    (a, b) =>
      a.uri.localeCompare(b.uri) ||
      a.range.start.line - b.range.start.line ||
      a.range.start.character - b.range.start.character
  )
}

describe('[foundry] references - import-forms', () => {
  if (shouldSkipFoundryTests()) {
    return
  }

  let importerPath: string
  let otherPath: string
  let midPath: string
  let deepPath: string
  let basePath: string
  let userAPath: string

  before(async () => {
    client = await getInitializedClient()
    importerPath = getProjectPath('foundry/src/definition/import-forms/Importer.sol')
    otherPath = getProjectPath('foundry/src/definition/import-forms/Other.sol')
    midPath = getProjectPath('foundry/src/definition/import-forms/Mid.sol')
    deepPath = getProjectPath('foundry/src/definition/import-forms/Deep.sol')
    basePath = getProjectPath('foundry/src/references/import-forms/IfBase.sol')
    userAPath = getProjectPath('foundry/src/references/import-forms/IfUserA.sol')

    await client.openDocument(importerPath)
    await client.openDocument(otherPath)
    await client.openDocument(midPath)
    await client.openDocument(deepPath)
    await client.openDocument(basePath)
    await client.openDocument(userAPath)
  })

  after(async () => {
    await client.closeAllDocuments()
  })

  test('contract imported under an alias, from its declaration, without the alias name in the braces', async () => {
    const locations = await client.findReferences(toUri(otherPath), makePosition(3, 10))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(otherPath), range: makeRange(3, 9, 3, 14) },
        { uri: toUri(importerPath), range: makeRange(4, 8, 4, 13) },
        { uri: toUri(importerPath), range: makeRange(11, 4, 11, 14) },
      ])
    )
  })

  test('contract imported under an alias, from a use of the alias, without the alias name in the braces', async () => {
    const locations = await client.findReferences(toUri(importerPath), makePosition(11, 5))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(otherPath), range: makeRange(3, 9, 3, 14) },
        { uri: toUri(importerPath), range: makeRange(4, 8, 4, 13) },
        { uri: toUri(importerPath), range: makeRange(11, 4, 11, 14) },
      ])
    )
  })

  test('contract reached through two plain imports, from its declaration', async () => {
    const locations = await client.findReferences(toUri(deepPath), makePosition(3, 10))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(deepPath), range: makeRange(3, 9, 3, 13) },
        { uri: toUri(midPath), range: makeRange(5, 16, 5, 20) },
        { uri: toUri(importerPath), range: makeRange(13, 4, 13, 8) },
      ])
    )
  })

  test('contract reached through two plain imports, from a use', async () => {
    const locations = await client.findReferences(toUri(importerPath), makePosition(13, 5))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(deepPath), range: makeRange(3, 9, 3, 13) },
        { uri: toUri(midPath), range: makeRange(5, 16, 5, 20) },
        { uri: toUri(importerPath), range: makeRange(13, 4, 13, 8) },
      ])
    )
  })

  test('constant imported by name, from its declaration', async () => {
    const locations = await client.findReferences(toUri(basePath), makePosition(3, 18))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(basePath), range: makeRange(3, 17, 3, 25) },
        { uri: toUri(basePath), range: makeRange(13, 15, 13, 23) },
        { uri: toUri(userAPath), range: makeRange(3, 37, 3, 45) },
        { uri: toUri(userAPath), range: makeRange(11, 16, 11, 24) },
      ])
    )
  })

  test('constant imported by name, from the name in the import braces', async () => {
    const locations = await client.findReferences(toUri(userAPath), makePosition(3, 38))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(basePath), range: makeRange(3, 17, 3, 25) },
        { uri: toUri(basePath), range: makeRange(13, 15, 13, 23) },
        { uri: toUri(userAPath), range: makeRange(3, 37, 3, 45) },
        { uri: toUri(userAPath), range: makeRange(11, 16, 11, 24) },
      ])
    )
  })

  test('error imported by name, from a revert', async () => {
    const locations = await client.findReferences(toUri(userAPath), makePosition(11, 34))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(basePath), range: makeRange(5, 6, 5, 14) },
        { uri: toUri(userAPath), range: makeRange(3, 27, 3, 35) },
        { uri: toUri(userAPath), range: makeRange(11, 33, 11, 41) },
      ])
    )
  })
})
