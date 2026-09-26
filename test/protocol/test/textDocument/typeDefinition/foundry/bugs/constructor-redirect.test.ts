import { expect } from 'chai'
import { test } from 'mocha'
import { Definition, DefinitionLink, Location } from 'vscode-languageserver-protocol'
import { shouldSkipFoundryTests, toUri } from '../../../../../src/helpers'
import { TestLanguageClient } from '../../../../../src/TestLanguageClient'
import { getInitializedClient } from '../../../../client'
import { getProjectPath, makePosition, makeRange } from '../../../../helpers'

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

describe('[foundry] typeDefinition bug - a contract name in a new expression resolves to its constructor', () => {
  if (shouldSkipFoundryTests()) {
    return
  }

  let derivedPath: string
  let basePath: string

  before(async () => {
    client = await getInitializedClient()
    derivedPath = getProjectPath('foundry/src/type-definition/inheritance/IhDerived.sol')
    basePath = getProjectPath('foundry/src/type-definition/inheritance/IhBase.sol')

    await client.openDocument(derivedPath)
    await client.openDocument(basePath)
  })

  after(async () => {
    await client.closeAllDocuments()
  })

  // Bug: returns no locations, since the name resolves to the constructor, which has no type.
  test.skip('contract name in new gives the contract', async () => {
    const locations = await client.findTypeDefinition(toUri(derivedPath), makePosition(18, 20))

    expect(sorted(locations)).to.deep.equal(sorted([{ uri: toUri(derivedPath), range: makeRange(5, 9, 5, 16) }]))
  })
})
