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

describe('[foundry] typeDefinition bug - a struct named in an import brace list is never bound', () => {
  if (shouldSkipFoundryTests()) {
    return
  }

  let importerPath: string
  let shapesPath: string
  let otherPath: string
  let midPath: string
  let deepPath: string

  before(async () => {
    client = await getInitializedClient()
    importerPath = getProjectPath('foundry/src/type-definition/import-forms/IfImporter.sol')
    shapesPath = getProjectPath('foundry/src/type-definition/import-forms/IfShapes.sol')
    otherPath = getProjectPath('foundry/src/type-definition/import-forms/IfOther.sol')
    midPath = getProjectPath('foundry/src/type-definition/import-forms/IfMid.sol')
    deepPath = getProjectPath('foundry/src/type-definition/import-forms/IfDeep.sol')

    await client.openDocument(importerPath)
    await client.openDocument(shapesPath)
    await client.openDocument(otherPath)
    await client.openDocument(midPath)
    await client.openDocument(deepPath)
  })

  after(async () => {
    await client.closeAllDocuments()
  })

  // Bug: returns no locations.
  test.skip('state variable of a struct imported by name at its declaration', async () => {
    const locations = await client.findTypeDefinition(toUri(importerPath), makePosition(11, 19))

    expect(sorted(locations)).to.deep.equal(sorted([{ uri: toUri(shapesPath), range: makeRange(3, 7, 3, 14) }]))
  })

  // Bug: returns no locations.
  test.skip('state variable of a struct imported by name at a use', async () => {
    const locations = await client.findTypeDefinition(toUri(importerPath), makePosition(19, 15))

    expect(sorted(locations)).to.deep.equal(sorted([{ uri: toUri(shapesPath), range: makeRange(3, 7, 3, 14) }]))
  })

  // Bug: returns no locations.
  test.skip('state variable of a struct imported under an alias at its declaration', async () => {
    const locations = await client.findTypeDefinition(toUri(importerPath), makePosition(12, 22))

    expect(sorted(locations)).to.deep.equal(sorted([{ uri: toUri(otherPath), range: makeRange(3, 7, 3, 14) }]))
  })

  // Bug: returns no locations.
  test.skip('state variable of a struct imported under an alias at a use', async () => {
    const locations = await client.findTypeDefinition(toUri(importerPath), makePosition(19, 32))

    expect(sorted(locations)).to.deep.equal(sorted([{ uri: toUri(otherPath), range: makeRange(3, 7, 3, 14) }]))
  })

  // Bug: returns no locations.
  test.skip('aliased struct type name gives the original struct', async () => {
    const locations = await client.findTypeDefinition(toUri(importerPath), makePosition(12, 4))

    expect(sorted(locations)).to.deep.equal(sorted([{ uri: toUri(otherPath), range: makeRange(3, 7, 3, 14) }]))
  })

  // Bug: returns no locations.
  test.skip('function returning a struct imported under an alias at its name', async () => {
    const locations = await client.findTypeDefinition(toUri(importerPath), makePosition(35, 13))

    expect(sorted(locations)).to.deep.equal(sorted([{ uri: toUri(otherPath), range: makeRange(3, 7, 3, 14) }]))
  })
})
