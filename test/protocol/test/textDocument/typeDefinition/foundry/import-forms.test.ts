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

describe('[foundry] typeDefinition - import-forms', () => {
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

  test('udvt imported under an alias gives the original type', async () => {
    const locations = await client.findTypeDefinition(toUri(importerPath), makePosition(19, 58))

    expect(sorted(locations)).to.deep.equal(sorted([{ uri: toUri(shapesPath), range: makeRange(13, 5, 13, 13) }]))
  })

  test('struct reached through a transitive plain import', async () => {
    const locations = await client.findTypeDefinition(toUri(importerPath), makePosition(28, 15))

    expect(sorted(locations)).to.deep.equal(sorted([{ uri: toUri(deepPath), range: makeRange(8, 7, 8, 19) }]))
  })

  test('enum-typed struct member reached through a transitive plain import', async () => {
    const locations = await client.findTypeDefinition(toUri(importerPath), makePosition(28, 22))

    expect(sorted(locations)).to.deep.equal(sorted([{ uri: toUri(deepPath), range: makeRange(3, 5, 3, 15) }]))
  })
})
