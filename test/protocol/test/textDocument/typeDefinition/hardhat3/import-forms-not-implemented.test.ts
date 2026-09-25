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

describe('[hardhat3] typeDefinition - import-forms (not implemented)', () => {
  let importerPath: string
  let shapesPath: string
  let otherPath: string
  let midPath: string
  let deepPath: string

  before(async () => {
    client = await getInitializedClient()
    importerPath = getProjectPath('hardhat3/contracts/type-definition/import-forms/IfImporter.sol')
    shapesPath = getProjectPath('hardhat3/contracts/type-definition/import-forms/IfShapes.sol')
    otherPath = getProjectPath('hardhat3/contracts/type-definition/import-forms/IfOther.sol')
    midPath = getProjectPath('hardhat3/contracts/type-definition/import-forms/IfMid.sol')
    deepPath = getProjectPath('hardhat3/contracts/type-definition/import-forms/IfDeep.sol')

    await client.openDocument(importerPath)
    await client.openDocument(shapesPath)
    await client.openDocument(otherPath)
    await client.openDocument(midPath)
    await client.openDocument(deepPath)
  })

  after(async () => {
    await client.closeAllDocuments()
  })

  // Not implemented: returns no locations.
  test.skip('state variable of a struct type through a star-import module alias', async () => {
    const locations = await client.findTypeDefinition(toUri(importerPath), makePosition(14, 21))

    expect(sorted(locations)).to.deep.equal(sorted([{ uri: toUri(shapesPath), range: makeRange(3, 7, 3, 14) }]))
  })

  // Not implemented: returns no locations.
  test.skip('local of an interface type through a star-import module alias at its declaration', async () => {
    const locations = await client.findTypeDefinition(toUri(importerPath), makePosition(23, 19))

    expect(sorted(locations)).to.deep.equal(sorted([{ uri: toUri(shapesPath), range: makeRange(15, 10, 15, 18) }]))
  })

  // Not implemented: returns no locations.
  test.skip('local of an interface type through a star-import module alias at a use', async () => {
    const locations = await client.findTypeDefinition(toUri(importerPath), makePosition(24, 15))

    expect(sorted(locations)).to.deep.equal(sorted([{ uri: toUri(shapesPath), range: makeRange(15, 10, 15, 18) }]))
  })

  // Not implemented: returns no locations.
  test.skip('state variable of an enum type through a unit-import module alias', async () => {
    const locations = await client.findTypeDefinition(toUri(importerPath), makePosition(15, 21))

    expect(sorted(locations)).to.deep.equal(sorted([{ uri: toUri(shapesPath), range: makeRange(8, 5, 8, 12) }]))
  })

  // Not implemented: returns no locations.
  test.skip('library call through a star-import module alias gives its return type', async () => {
    const locations = await client.findTypeDefinition(toUri(importerPath), makePosition(32, 24))

    expect(sorted(locations)).to.deep.equal(sorted([{ uri: toUri(shapesPath), range: makeRange(3, 7, 3, 14) }]))
  })
})
