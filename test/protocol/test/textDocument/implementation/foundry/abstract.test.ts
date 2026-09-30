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

describe('[foundry] implementation - abstract', () => {
  if (shouldSkipFoundryTests()) {
    return
  }

  let shapesPath: string
  let concretePath: string

  before(async () => {
    client = await getInitializedClient()
    shapesPath = getProjectPath('foundry/src/implementation/abstract/Shapes.sol')
    concretePath = getProjectPath('foundry/src/implementation/abstract/Concrete.sol')

    await client.openDocument(shapesPath)
    await client.openDocument(concretePath)
  })

  after(async () => {
    await client.closeAllDocuments()
  })

  test('virtual function with a body, from its declaration, includes itself and its overrides', async () => {
    const locations = await client.findImplementations(toUri(shapesPath), makePosition(8, 13))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(shapesPath), range: makeRange(8, 13, 8, 21) },
        { uri: toUri(shapesPath), range: makeRange(27, 13, 27, 21) },
        { uri: toUri(concretePath), range: makeRange(10, 13, 10, 21) },
      ])
    )
  })

  test('super call from the middle contract, includes the base and its overrides', async () => {
    const locations = await client.findImplementations(toUri(shapesPath), makePosition(28, 21))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(shapesPath), range: makeRange(8, 13, 8, 21) },
        { uri: toUri(shapesPath), range: makeRange(27, 13, 27, 21) },
        { uri: toUri(concretePath), range: makeRange(10, 13, 10, 21) },
      ])
    )
  })

  test('non-virtual function called through a contract-typed parameter', async () => {
    const locations = await client.findImplementations(toUri(concretePath), makePosition(60, 55))

    expect(sorted(locations)).to.deep.equal(sorted([{ uri: toUri(shapesPath), range: makeRange(12, 13, 12, 22) }]))
  })

  test('super call two levels down gives the virtual function and its override (right by accident: the chain skips a base that does not redeclare the function)', async () => {
    const locations = await client.findImplementations(toUri(concretePath), makePosition(32, 21))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(concretePath), range: makeRange(25, 13, 25, 17) },
        { uri: toUri(concretePath), range: makeRange(31, 13, 31, 17) },
      ])
    )
  })

  test('bodiless function in a diamond root, from its declaration', async () => {
    const locations = await client.findImplementations(toUri(concretePath), makePosition(37, 13))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(concretePath), range: makeRange(41, 13, 41, 16) },
        { uri: toUri(concretePath), range: makeRange(47, 13, 47, 16) },
        { uri: toUri(concretePath), range: makeRange(53, 13, 53, 16) },
      ])
    )
  })
})
