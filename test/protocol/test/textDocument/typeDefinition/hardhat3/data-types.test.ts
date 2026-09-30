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

describe('[hardhat3] typeDefinition - data-types', () => {
  let shapesPath: string

  before(async () => {
    client = await getInitializedClient()
    shapesPath = getProjectPath('hardhat3/contracts/type-definition/data-types/DtShapes.sol')

    await client.openDocument(shapesPath)
  })

  after(async () => {
    await client.closeAllDocuments()
  })

  test('struct parameter at its declaration', async () => {
    const locations = await client.findTypeDefinition(toUri(shapesPath), makePosition(30, 36))

    expect(sorted(locations)).to.deep.equal(sorted([{ uri: toUri(shapesPath), range: makeRange(20, 11, 20, 16) }]))
  })

  test('struct local at its declaration', async () => {
    const locations = await client.findTypeDefinition(toUri(shapesPath), makePosition(35, 21))

    expect(sorted(locations)).to.deep.equal(sorted([{ uri: toUri(shapesPath), range: makeRange(20, 11, 20, 16) }]))
  })

  test('struct local at a use', async () => {
    const locations = await client.findTypeDefinition(toUri(shapesPath), makePosition(36, 25))

    expect(sorted(locations)).to.deep.equal(sorted([{ uri: toUri(shapesPath), range: makeRange(20, 11, 20, 16) }]))
  })

  test('struct member reached through member access', async () => {
    const locations = await client.findTypeDefinition(toUri(shapesPath), makePosition(36, 31))

    expect(sorted(locations)).to.deep.equal(sorted([{ uri: toUri(shapesPath), range: makeRange(15, 11, 15, 16) }]))
  })

  test('struct member at its declaration', async () => {
    const locations = await client.findTypeDefinition(toUri(shapesPath), makePosition(22, 14))

    expect(sorted(locations)).to.deep.equal(sorted([{ uri: toUri(shapesPath), range: makeRange(15, 11, 15, 16) }]))
  })

  test('enum-typed struct member at the end of a chain through an array index', async () => {
    const locations = await client.findTypeDefinition(toUri(shapesPath), makePosition(40, 31))

    expect(sorted(locations)).to.deep.equal(sorted([{ uri: toUri(shapesPath), range: makeRange(10, 9, 10, 14) }]))
  })

  test('nested array state variable at a use', async () => {
    const locations = await client.findTypeDefinition(toUri(shapesPath), makePosition(44, 15))

    expect(sorted(locations)).to.deep.equal(sorted([{ uri: toUri(shapesPath), range: makeRange(20, 11, 20, 16) }]))
  })

  test('nested mapping state variable at a use', async () => {
    const locations = await client.findTypeDefinition(toUri(shapesPath), makePosition(44, 30))

    expect(sorted(locations)).to.deep.equal(sorted([{ uri: toUri(shapesPath), range: makeRange(20, 11, 20, 16) }]))
  })

  test('mapping with an enum key gives the value type', async () => {
    const locations = await client.findTypeDefinition(toUri(shapesPath), makePosition(44, 56))

    expect(sorted(locations)).to.deep.equal(sorted([{ uri: toUri(shapesPath), range: makeRange(15, 11, 15, 16) }]))
  })
})
