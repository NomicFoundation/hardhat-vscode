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

describe('[hardhat3] typeDefinition - functions (not implemented)', () => {
  let functionsPath: string
  let libPath: string

  before(async () => {
    client = await getInitializedClient()
    functionsPath = getProjectPath('hardhat3/contracts/type-definition/functions/Functions.sol')
    libPath = getProjectPath('hardhat3/contracts/type-definition/functions/FunctionsLib.sol')

    await client.openDocument(functionsPath)
    await client.openDocument(libPath)
  })

  after(async () => {
    await client.closeAllDocuments()
  })

  // Not implemented: returns no locations.
  test.skip("named argument to a function gives the parameter's type", async () => {
    const locations = await client.findTypeDefinition(toUri(functionsPath), makePosition(43, 33))

    expect(sorted(locations)).to.deep.equal(sorted([{ uri: toUri(functionsPath), range: makeRange(6, 9, 6, 13) }]))
  })

  // Not implemented: returns no locations.
  test.skip("named argument to a function in another file gives the parameter's type", async () => {
    const locations = await client.findTypeDefinition(toUri(functionsPath), makePosition(49, 61))

    expect(sorted(locations)).to.deep.equal(sorted([{ uri: toUri(libPath), range: makeRange(3, 10, 3, 18) }]))
  })
})
