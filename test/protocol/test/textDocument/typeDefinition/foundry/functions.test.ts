import { expect } from 'chai'
import { test } from 'mocha'
import { Definition, DefinitionLink, Location } from 'vscode-languageserver-protocol'
import { shouldSkipFoundryTests, toUri } from '../../../../src/helpers'
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

describe('[foundry] typeDefinition - functions', () => {
  if (shouldSkipFoundryTests()) {
    return
  }

  let functionsPath: string
  let libPath: string

  before(async () => {
    client = await getInitializedClient()
    functionsPath = getProjectPath('foundry/src/type-definition/functions/Functions.sol')
    libPath = getProjectPath('foundry/src/type-definition/functions/FunctionsLib.sol')

    await client.openDocument(functionsPath)
    await client.openDocument(libPath)
  })

  after(async () => {
    await client.closeAllDocuments()
  })

  test('overload declared first gives its return type (right only by accident)', async () => {
    const locations = await client.findTypeDefinition(toUri(functionsPath), makePosition(41, 21))

    expect(sorted(locations)).to.deep.equal(sorted([{ uri: toUri(functionsPath), range: makeRange(6, 9, 6, 13) }]))
  })

  test('library function call gives a struct declared in the library', async () => {
    const locations = await client.findTypeDefinition(toUri(functionsPath), makePosition(44, 37))

    expect(sorted(locations)).to.deep.equal(sorted([{ uri: toUri(libPath), range: makeRange(8, 11, 8, 16) }]))
  })

  test('public mapping getter called on an instance gives the value type', async () => {
    const locations = await client.findTypeDefinition(toUri(functionsPath), makePosition(50, 34))

    expect(sorted(locations)).to.deep.equal(sorted([{ uri: toUri(libPath), range: makeRange(19, 9, 19, 15) }]))
  })

  test('external function used as a value gives its return type', async () => {
    const locations = await client.findTypeDefinition(toUri(functionsPath), makePosition(51, 90))

    expect(sorted(locations)).to.deep.equal(sorted([{ uri: toUri(libPath), range: makeRange(24, 11, 24, 18) }]))
  })
})
