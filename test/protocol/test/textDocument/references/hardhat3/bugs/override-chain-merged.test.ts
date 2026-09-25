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

describe('[hardhat3] references bug - a function and the functions it overrides share one set', () => {
  let basePath: string
  let derivedPath: string

  before(async () => {
    client = await getInitializedClient()
    basePath = getProjectPath('hardhat3/contracts/definition/inheritance/Base.sol')
    derivedPath = getProjectPath('hardhat3/contracts/definition/inheritance/Derived.sol')

    await client.openDocument(basePath)
    await client.openDocument(derivedPath)
  })

  after(async () => {
    await client.closeAllDocuments()
  })

  // Bug: returns the 7 locations of the whole override chain, Base.value, Middle.value and Leaf.value with the calls of all three.
  test.skip('base function, from its declaration', async () => {
    const locations = await client.findReferences(toUri(basePath), makePosition(18, 14))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(basePath), range: makeRange(18, 13, 18, 18) },
        { uri: toUri(derivedPath), range: makeRange(9, 21, 9, 26) },
        { uri: toUri(derivedPath), range: makeRange(19, 20, 19, 25) },
        { uri: toUri(derivedPath), range: makeRange(29, 17, 29, 22) },
      ])
    )
  })

  // Bug: returns the 7 locations of the whole override chain, Base.value, Middle.value and Leaf.value with the calls of all three.
  test.skip('base function, from super.f()', async () => {
    const locations = await client.findReferences(toUri(derivedPath), makePosition(9, 22))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(basePath), range: makeRange(18, 13, 18, 18) },
        { uri: toUri(derivedPath), range: makeRange(9, 21, 9, 26) },
        { uri: toUri(derivedPath), range: makeRange(19, 20, 19, 25) },
        { uri: toUri(derivedPath), range: makeRange(29, 17, 29, 22) },
      ])
    )
  })

  // Bug: returns the 7 locations of the whole override chain, Base.value, Middle.value and Leaf.value with the calls of all three.
  test.skip('overriding function, from its declaration', async () => {
    const locations = await client.findReferences(toUri(derivedPath), makePosition(8, 14))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(derivedPath), range: makeRange(8, 13, 8, 18) },
        { uri: toUri(derivedPath), range: makeRange(19, 36, 19, 41) },
      ])
    )
  })

  // Bug: returns the 7 locations of the whole override chain, Base.value, Middle.value and Leaf.value with the calls of all three.
  test.skip('overriding function, from super.f() in a grandchild', async () => {
    const locations = await client.findReferences(toUri(derivedPath), makePosition(19, 37))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(derivedPath), range: makeRange(8, 13, 8, 18) },
        { uri: toUri(derivedPath), range: makeRange(19, 36, 19, 41) },
      ])
    )
  })
})
