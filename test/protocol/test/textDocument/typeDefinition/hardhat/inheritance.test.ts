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

describe('[hardhat] typeDefinition - inheritance', () => {
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

  test('inherited state variable of an interface type', async () => {
    const locations = await client.findTypeDefinition(toUri(derivedPath), makePosition(17, 8))

    expect(sorted(locations)).to.deep.equal(sorted([{ uri: toUri(basePath), range: makeRange(3, 10, 3, 18) }]))
  })

  test('contract-typed state variable at its declaration', async () => {
    const locations = await client.findTypeDefinition(toUri(derivedPath), makePosition(14, 19))

    expect(sorted(locations)).to.deep.equal(sorted([{ uri: toUri(derivedPath), range: makeRange(5, 9, 5, 16) }]))
  })

  test('contract-typed state variable as a member access receiver', async () => {
    const locations = await client.findTypeDefinition(toUri(derivedPath), makePosition(30, 33))

    expect(sorted(locations)).to.deep.equal(sorted([{ uri: toUri(derivedPath), range: makeRange(5, 9, 5, 16) }]))
  })

  test('interface name in a conversion', async () => {
    const locations = await client.findTypeDefinition(toUri(derivedPath), makePosition(17, 16))

    expect(sorted(locations)).to.deep.equal(sorted([{ uri: toUri(basePath), range: makeRange(3, 10, 3, 18) }]))
  })

  test('function called through super gives its return type', async () => {
    const locations = await client.findTypeDefinition(toUri(derivedPath), makePosition(22, 21))

    expect(sorted(locations)).to.deep.equal(sorted([{ uri: toUri(basePath), range: makeRange(13, 18, 13, 24) }]))
  })

  test('interface member call gives its own interface', async () => {
    const locations = await client.findTypeDefinition(toUri(derivedPath), makePosition(27, 27))

    expect(sorted(locations)).to.deep.equal(sorted([{ uri: toUri(basePath), range: makeRange(3, 10, 3, 18) }]))
  })

  test('contract-typed return variable', async () => {
    const locations = await client.findTypeDefinition(toUri(derivedPath), makePosition(25, 46))

    expect(sorted(locations)).to.deep.equal(sorted([{ uri: toUri(derivedPath), range: makeRange(5, 9, 5, 16) }]))
  })

  test('library name in a library call', async () => {
    const locations = await client.findTypeDefinition(toUri(derivedPath), makePosition(30, 20))

    expect(sorted(locations)).to.deep.equal(sorted([{ uri: toUri(basePath), range: makeRange(7, 8, 7, 14) }]))
  })
})
