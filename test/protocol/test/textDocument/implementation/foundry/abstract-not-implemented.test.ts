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

describe('[foundry] implementation - abstract (not implemented)', () => {
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

  // Not implemented: returns only the modifier itself (Shapes.sol 16:13-16:20), not its override.
  test.skip('virtual modifier, from its declaration, includes its override', async () => {
    const locations = await client.findImplementations(toUri(shapesPath), makePosition(16, 13))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(shapesPath), range: makeRange(16, 13, 16, 20) },
        { uri: toUri(concretePath), range: makeRange(14, 13, 14, 20) },
      ])
    )
  })

  // Not implemented: returns only the modifier itself (Shapes.sol 16:13-16:20), not its override.
  test.skip('virtual modifier, from its use in the base, includes its override', async () => {
    const locations = await client.findImplementations(toUri(shapesPath), makePosition(21, 29))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(shapesPath), range: makeRange(16, 13, 16, 20) },
        { uri: toUri(concretePath), range: makeRange(14, 13, 14, 20) },
      ])
    )
  })

  // Not implemented: returns the contract's declaration and its type-name uses (Shapes.sol 3:18, 26:30; Concrete.sol 24:21, 59:21), not the inheriting contracts.
  test.skip('abstract contract, from its name, gives the non-abstract contracts inheriting it', async () => {
    const locations = await client.findImplementations(toUri(shapesPath), makePosition(3, 18))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(concretePath), range: makeRange(5, 9, 5, 17) },
        { uri: toUri(concretePath), range: makeRange(24, 9, 24, 17) },
        { uri: toUri(concretePath), range: makeRange(30, 9, 30, 15) },
      ])
    )
  })

  // Not implemented: returns the contract's declaration and its type-name uses (Shapes.sol 3:18, 26:30; Concrete.sol 24:21, 59:21), not the inheriting contracts.
  test.skip('abstract contract, from an is list, gives the non-abstract contracts inheriting it', async () => {
    const locations = await client.findImplementations(toUri(concretePath), makePosition(24, 21))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(concretePath), range: makeRange(5, 9, 5, 17) },
        { uri: toUri(concretePath), range: makeRange(24, 9, 24, 17) },
        { uri: toUri(concretePath), range: makeRange(30, 9, 30, 15) },
      ])
    )
  })

  // Not implemented: returns the contract's declaration and its type-name uses (Concrete.sol 36:18, 40:28, 46:29, 63:19), not the inheriting contract.
  test.skip('abstract diamond root, from its name, gives the contract inheriting it through both sides', async () => {
    const locations = await client.findImplementations(toUri(concretePath), makePosition(36, 18))

    expect(sorted(locations)).to.deep.equal(sorted([{ uri: toUri(concretePath), range: makeRange(52, 9, 52, 15) }]))
  })
})
