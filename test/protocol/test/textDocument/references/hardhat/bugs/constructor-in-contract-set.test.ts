import { expect } from 'chai'
import { test } from 'mocha'
import { Location } from 'vscode-languageserver-protocol'
import { toUri } from '../../../../../src/helpers'
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

describe('[hardhat] references bug - the constructor keyword in the set of its contract', () => {
  let basePath: string
  let derivedPath: string

  before(async () => {
    client = await getInitializedClient()
    basePath = getProjectPath('hardhat/contracts/definition/inheritance/Base.sol')
    derivedPath = getProjectPath('hardhat/contracts/definition/inheritance/Derived.sol')

    await client.openDocument(basePath)
    await client.openDocument(derivedPath)
  })

  after(async () => {
    await client.closeAllDocuments()
  })

  // Bug: returns the correct set plus the constructor keyword (14:4-14:15).
  test.skip('abstract base contract, from its name', async () => {
    const locations = await client.findReferences(toUri(basePath), makePosition(11, 19))

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

  // Bug: returns the correct set plus the constructor keyword (6:4-6:15).
  test.skip('contract with a constructor, from its name', async () => {
    const locations = await client.findReferences(toUri(derivedPath), makePosition(5, 10))

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
