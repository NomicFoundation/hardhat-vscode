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

describe('[hardhat] typeDefinition - inheritance (not implemented)', () => {
  let derivedPath: string
  let basePath: string

  before(async () => {
    client = await getInitializedClient()
    derivedPath = getProjectPath('hardhat/contracts/type-definition/inheritance/IhDerived.sol')
    basePath = getProjectPath('hardhat/contracts/type-definition/inheritance/IhBase.sol')

    await client.openDocument(derivedPath)
    await client.openDocument(basePath)
  })

  after(async () => {
    await client.closeAllDocuments()
  })

  // Not implemented: returns no locations.
  test.skip('this gives the current contract', async () => {
    const locations = await client.findTypeDefinition(toUri(derivedPath), makePosition(28, 23))

    expect(sorted(locations)).to.deep.equal(sorted([{ uri: toUri(derivedPath), range: makeRange(13, 9, 13, 18) }]))
  })
})
