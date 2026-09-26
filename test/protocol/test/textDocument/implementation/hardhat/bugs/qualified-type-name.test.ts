import { expect } from 'chai'
import { test } from 'mocha'
import { Definition, DefinitionLink, Location } from 'vscode-languageserver-protocol'
import { toUri } from '../../../../../src/helpers'
import { TestLanguageClient } from '../../../../../src/TestLanguageClient'
import { getInitializedClient } from '../../../../client'
import { getProjectPath, makePosition, makeRange } from '../../../../helpers'

let client!: TestLanguageClient

// Implementations come in no particular order: compare them as sets. The server answers with plain
// locations, never links.
function sorted(result: Definition | DefinitionLink[] | null) {
  const locations = (result === null ? [] : Array.isArray(result) ? result : [result]) as Location[]

  return [...locations].sort(
    (a, b) =>
      a.uri.localeCompare(b.uri) ||
      a.range.start.line - b.range.start.line ||
      a.range.start.character - b.range.start.character
  )
}

describe('[hardhat] implementation bug - qualified type name looked up as one dotted name', () => {
  let typesPath: string
  let shapesPath: string
  let otherPath: string

  before(async () => {
    client = await getInitializedClient()
    typesPath = getProjectPath('hardhat/contracts/implementation/type-kinds/TkTypes.sol')
    shapesPath = getProjectPath('hardhat/contracts/implementation/type-kinds/TkShapes.sol')
    otherPath = getProjectPath('hardhat/contracts/implementation/type-kinds/TkOther.sol')

    await client.openDocument(typesPath)
    await client.openDocument(shapesPath)
    await client.openDocument(otherPath)
  })

  after(async () => {
    await client.closeAllDocuments()
  })

  // Bug: returns only TkShapes.sol 6:11-6:16, 17:4-17:9 and 44:38-44:43, missing TkShapes.Inner in TkOther.sol (12:13-12:18).
  test.skip('contract-level struct includes its qualified use in another file', async () => {
    const locations = await client.findImplementations(toUri(shapesPath), makePosition(6, 12))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(shapesPath), range: makeRange(6, 11, 6, 16) },
        { uri: toUri(shapesPath), range: makeRange(17, 4, 17, 9) },
        { uri: toUri(shapesPath), range: makeRange(44, 38, 44, 43) },
        { uri: toUri(otherPath), range: makeRange(12, 13, 12, 18) },
      ])
    )
  })
})
