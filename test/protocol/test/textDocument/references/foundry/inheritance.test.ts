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

describe('[foundry] references - inheritance', () => {
  if (shouldSkipFoundryTests()) {
    return
  }

  let basePath: string
  let derivedPath: string

  before(async () => {
    client = await getInitializedClient()
    basePath = getProjectPath('foundry/src/definition/inheritance/Base.sol')
    derivedPath = getProjectPath('foundry/src/definition/inheritance/Derived.sol')

    await client.openDocument(basePath)
    await client.openDocument(derivedPath)
  })

  after(async () => {
    await client.closeAllDocuments()
  })

  test('inherited state variable, from its declaration', async () => {
    const locations = await client.findReferences(toUri(basePath), makePosition(12, 22))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(basePath), range: makeRange(12, 21, 12, 27) },
        { uri: toUri(basePath), range: makeRange(15, 8, 15, 14) },
        { uri: toUri(basePath), range: makeRange(19, 15, 19, 21) },
        { uri: toUri(derivedPath), range: makeRange(13, 8, 13, 14) },
        { uri: toUri(derivedPath), range: makeRange(23, 8, 23, 14) },
        { uri: toUri(derivedPath), range: makeRange(29, 8, 29, 14) },
      ])
    )
  })

  test('inherited state variable, from a use two levels down', async () => {
    const locations = await client.findReferences(toUri(derivedPath), makePosition(23, 9))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(basePath), range: makeRange(12, 21, 12, 27) },
        { uri: toUri(basePath), range: makeRange(15, 8, 15, 14) },
        { uri: toUri(basePath), range: makeRange(19, 15, 19, 21) },
        { uri: toUri(derivedPath), range: makeRange(13, 8, 13, 14) },
        { uri: toUri(derivedPath), range: makeRange(23, 8, 23, 14) },
        { uri: toUri(derivedPath), range: makeRange(29, 8, 29, 14) },
      ])
    )
  })

  test('contract without a constructor, from its name', async () => {
    const locations = await client.findReferences(toUri(derivedPath), makePosition(17, 10))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(derivedPath), range: makeRange(17, 9, 17, 13) },
        { uri: toUri(derivedPath), range: makeRange(36, 8, 36, 12) },
        { uri: toUri(derivedPath), range: makeRange(36, 26, 36, 30) },
        { uri: toUri(derivedPath), range: makeRange(41, 21, 41, 25) },
      ])
    )
  })

  test('contract without a constructor, from new with call options', async () => {
    const locations = await client.findReferences(toUri(derivedPath), makePosition(36, 27))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(derivedPath), range: makeRange(17, 9, 17, 13) },
        { uri: toUri(derivedPath), range: makeRange(36, 8, 36, 12) },
        { uri: toUri(derivedPath), range: makeRange(36, 26, 36, 30) },
        { uri: toUri(derivedPath), range: makeRange(41, 21, 41, 25) },
      ])
    )
  })

  test('interface used across files, from its name', async () => {
    const locations = await client.findReferences(toUri(basePath), makePosition(7, 11))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(basePath), range: makeRange(7, 10, 7, 19) },
        { uri: toUri(basePath), range: makeRange(11, 26, 11, 35) },
        { uri: toUri(derivedPath), range: makeRange(3, 14, 3, 23) },
        { uri: toUri(derivedPath), range: makeRange(41, 38, 41, 47) },
        { uri: toUri(derivedPath), range: makeRange(45, 15, 45, 24) },
      ])
    )
  })

  test('interface used across files, from the import directive', async () => {
    const locations = await client.findReferences(toUri(derivedPath), makePosition(3, 15))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(basePath), range: makeRange(7, 10, 7, 19) },
        { uri: toUri(basePath), range: makeRange(11, 26, 11, 35) },
        { uri: toUri(derivedPath), range: makeRange(3, 14, 3, 23) },
        { uri: toUri(derivedPath), range: makeRange(41, 38, 41, 47) },
        { uri: toUri(derivedPath), range: makeRange(45, 15, 45, 24) },
      ])
    )
  })
})
