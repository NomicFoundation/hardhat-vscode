import { expect } from 'chai'
import { test } from 'mocha'
import { Definition, DefinitionLink, Location } from 'vscode-languageserver-protocol'
import { shouldSkipFoundryTests, toUri } from '../../../../src/helpers'
import { TestLanguageClient } from '../../../../src/TestLanguageClient'
import { getInitializedClient } from '../../../client'
import { getProjectPath, makePosition, makeRange } from '../../../helpers'

let client!: TestLanguageClient

// Implementations come in no particular order: compare them as sets. The server answers with plain
// locations, never links.
function sorted(result: Definition | DefinitionLink[] | null) {
  const locations = (result === null ? [] : Array.isArray(result) ? result : [result]) as Location[]

  return [...locations].sort(
    (a, b) =>
      a.uri.localeCompare(b.uri) ||
      a.range.start.line - b.range.start.line ||
      a.range.start.character - b.range.start.character
  )
}

describe('[foundry] implementation - interfaces', () => {
  if (shouldSkipFoundryTests()) {
    return
  }

  let shapesPath: string
  let implsPath: string
  let usesPath: string

  before(async () => {
    client = await getInitializedClient()
    shapesPath = getProjectPath('foundry/src/implementation/interfaces/Shapes.sol')
    implsPath = getProjectPath('foundry/src/implementation/interfaces/Impls.sol')
    usesPath = getProjectPath('foundry/src/implementation/interfaces/Uses.sol')

    await client.openDocument(shapesPath)
    await client.openDocument(implsPath)
    await client.openDocument(usesPath)
  })

  after(async () => {
    await client.closeAllDocuments()
  })

  test('child interface function implemented in an abstract contract', async () => {
    const locations = await client.findImplementations(toUri(shapesPath), makePosition(8, 13))

    expect(sorted(locations)).to.deep.equal(sorted([{ uri: toUri(implsPath), range: makeRange(22, 13, 22, 18) }]))
  })

  test('child interface function called through a cast', async () => {
    const locations = await client.findImplementations(toUri(usesPath), makePosition(20, 26))

    expect(sorted(locations)).to.deep.equal(sorted([{ uri: toUri(implsPath), range: makeRange(22, 13, 22, 18) }]))
  })

  test('virtual implementation includes itself and its override', async () => {
    const locations = await client.findImplementations(toUri(implsPath), makePosition(8, 13))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(implsPath), range: makeRange(8, 13, 8, 17) },
        { uri: toUri(implsPath), range: makeRange(14, 13, 14, 17) },
      ])
    )
  })

  test('virtual implementation called through a contract-typed parameter', async () => {
    const locations = await client.findImplementations(toUri(usesPath), makePosition(16, 22))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(implsPath), range: makeRange(8, 13, 8, 17) },
        { uri: toUri(implsPath), range: makeRange(14, 13, 14, 17) },
      ])
    )
  })

  test('interface function implemented without the override keyword', async () => {
    const locations = await client.findImplementations(toUri(shapesPath), makePosition(14, 13))

    expect(sorted(locations)).to.deep.equal(sorted([{ uri: toUri(implsPath), range: makeRange(37, 13, 37, 17) }]))
  })
})
