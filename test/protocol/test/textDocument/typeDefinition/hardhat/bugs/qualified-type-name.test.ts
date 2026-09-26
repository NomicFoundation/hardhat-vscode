import { expect } from 'chai'
import { test } from 'mocha'
import { Definition, DefinitionLink, Location } from 'vscode-languageserver-protocol'
import { toUri } from '../../../../../src/helpers'
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

describe('[hardhat] typeDefinition bug - qualified type name looked up as one dotted name', () => {
  let shapesPath: string
  let functionsPath: string
  let libPath: string

  before(async () => {
    client = await getInitializedClient()
    shapesPath = getProjectPath('hardhat/contracts/type-definition/data-types/DtShapes.sol')
    functionsPath = getProjectPath('hardhat/contracts/type-definition/functions/Functions.sol')
    libPath = getProjectPath('hardhat/contracts/type-definition/functions/FunctionsLib.sol')

    await client.openDocument(shapesPath)
    await client.openDocument(functionsPath)
    await client.openDocument(libPath)
  })

  after(async () => {
    await client.closeAllDocuments()
  })

  // Bug: returns no locations.
  test.skip('local of a struct from another contract at its declaration', async () => {
    const locations = await client.findTypeDefinition(toUri(shapesPath), makePosition(48, 32))

    expect(sorted(locations)).to.deep.equal(sorted([{ uri: toUri(shapesPath), range: makeRange(4, 11, 4, 16) }]))
  })

  // Bug: returns no locations.
  test.skip('local of a struct from another contract at a use', async () => {
    const locations = await client.findTypeDefinition(toUri(shapesPath), makePosition(49, 15))

    expect(sorted(locations)).to.deep.equal(sorted([{ uri: toUri(shapesPath), range: makeRange(4, 11, 4, 16) }]))
  })

  // Bug: returns only the enum Kind (6:9-6:13).
  test.skip('function declaration returning a library struct and an enum', async () => {
    const locations = await client.findTypeDefinition(toUri(functionsPath), makePosition(13, 13))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(libPath), range: makeRange(8, 11, 8, 16) },
        { uri: toUri(functionsPath), range: makeRange(6, 9, 6, 13) },
      ])
    )
  })

  // Bug: returns only the enum Kind (6:9-6:13).
  test.skip('call returning a library struct and an enum', async () => {
    const locations = await client.findTypeDefinition(toUri(functionsPath), makePosition(39, 41))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(libPath), range: makeRange(8, 11, 8, 16) },
        { uri: toUri(functionsPath), range: makeRange(6, 9, 6, 13) },
      ])
    )
  })

  // Bug: returns no locations.
  test.skip('named return variable of a library struct type at a use', async () => {
    const locations = await client.findTypeDefinition(toUri(functionsPath), makePosition(35, 8))

    expect(sorted(locations)).to.deep.equal(sorted([{ uri: toUri(libPath), range: makeRange(8, 11, 8, 16) }]))
  })
})
