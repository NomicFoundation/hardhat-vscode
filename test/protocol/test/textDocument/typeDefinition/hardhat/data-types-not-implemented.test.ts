import { expect } from 'chai'
import { test } from 'mocha'
import { Definition, DefinitionLink, Location } from 'vscode-languageserver-protocol'
import { toUri } from '../../../../src/helpers'
import { TestLanguageClient } from '../../../../src/TestLanguageClient'
import { getInitializedClient } from '../../../client'
import { getProjectPath, makePosition, makeRange } from '../../../helpers'

let client!: TestLanguageClient

// A type definition can have several locations (a function's return types, say): compare them as
// sets. The server answers with plain locations, never links.
function sorted(result: Definition | DefinitionLink[] | null) {
  const locations = (result === null ? [] : Array.isArray(result) ? result : [result]) as Location[]

  return [...locations].sort(
    (a, b) =>
      a.uri.localeCompare(b.uri) ||
      a.range.start.line - b.range.start.line ||
      a.range.start.character - b.range.start.character
  )
}

describe('[hardhat] typeDefinition - data-types (not implemented)', () => {
  let shapesPath: string

  before(async () => {
    client = await getInitializedClient()
    shapesPath = getProjectPath('hardhat/contracts/type-definition/data-types/DtShapes.sol')

    await client.openDocument(shapesPath)
  })

  after(async () => {
    await client.closeAllDocuments()
  })

  // Not implemented: returns no locations.
  test.skip('enum value in a member access gives the enum', async () => {
    const locations = await client.findTypeDefinition(toUri(shapesPath), makePosition(44, 70))

    expect(sorted(locations)).to.deep.equal(sorted([{ uri: toUri(shapesPath), range: makeRange(10, 9, 10, 14) }]))
  })
})
