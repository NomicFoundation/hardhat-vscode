import { expect } from 'chai'
import { test } from 'mocha'
import { Location } from 'vscode-languageserver-protocol'
import { shouldSkipFoundryTests, toUri } from '../../../../../src/helpers'
import { TestLanguageClient } from '../../../../../src/TestLanguageClient'
import { getInitializedClient } from '../../../../client'
import { getProjectPath, makePosition, makeRange } from '../../../../helpers'

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

describe('[foundry] references bug - a request on a base constructor call or override list answers for the constructor', () => {
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

  // Bug: returns only the constructor keyword (14:4-14:15) and the requested Base(1).
  test.skip('contract, from a base constructor call in modifier form', async () => {
    const locations = await client.findReferences(toUri(derivedPath), makePosition(6, 19))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(basePath), range: makeRange(11, 18, 11, 22) },
        { uri: toUri(derivedPath), range: makeRange(3, 8, 3, 12) },
        { uri: toUri(derivedPath), range: makeRange(5, 19, 5, 23) },
        { uri: toUri(derivedPath), range: makeRange(6, 18, 6, 22) },
        { uri: toUri(derivedPath), range: makeRange(19, 15, 19, 19) },
        { uri: toUri(derivedPath), range: makeRange(27, 18, 27, 22) },
      ])
    )
  })

  // Bug: returns only the constructor keyword (6:4-6:15), override(Middle) and new Middle().
  test.skip('contract, from an override list', async () => {
    const locations = await client.findReferences(toUri(derivedPath), makePosition(22, 37))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(derivedPath), range: makeRange(5, 9, 5, 15) },
        { uri: toUri(derivedPath), range: makeRange(17, 17, 17, 23) },
        { uri: toUri(derivedPath), range: makeRange(22, 36, 22, 42) },
        { uri: toUri(derivedPath), range: makeRange(35, 8, 35, 14) },
        { uri: toUri(derivedPath), range: makeRange(35, 27, 35, 33) },
      ])
    )
  })
})
