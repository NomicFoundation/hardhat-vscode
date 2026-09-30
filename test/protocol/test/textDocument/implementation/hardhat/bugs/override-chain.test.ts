import { expect } from 'chai'
import { test } from 'mocha'
import { Definition, DefinitionLink, Location } from 'vscode-languageserver-protocol'
import { toUri } from '../../../../../src/helpers'
import { TestLanguageClient } from '../../../../../src/TestLanguageClient'
import { getInitializedClient } from '../../../../client'
import { getProjectPath, makePosition, makeRange } from '../../../../helpers'

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

describe('[hardhat] implementation bug - override chains linked by name, to direct bases only, in both directions', () => {
  let abShapesPath: string
  let abConcretePath: string
  let ifcShapesPath: string
  let ifcImplsPath: string
  let ifcUsesPath: string

  before(async () => {
    client = await getInitializedClient()
    abShapesPath = getProjectPath('hardhat/contracts/implementation/abstract/Shapes.sol')
    abConcretePath = getProjectPath('hardhat/contracts/implementation/abstract/Concrete.sol')
    ifcShapesPath = getProjectPath('hardhat/contracts/implementation/interfaces/Shapes.sol')
    ifcImplsPath = getProjectPath('hardhat/contracts/implementation/interfaces/Impls.sol')
    ifcUsesPath = getProjectPath('hardhat/contracts/implementation/interfaces/Uses.sol')

    await client.openDocument(abShapesPath)
    await client.openDocument(abConcretePath)
    await client.openDocument(ifcShapesPath)
    await client.openDocument(ifcImplsPath)
    await client.openDocument(ifcUsesPath)
  })

  after(async () => {
    await client.closeAllDocuments()
  })

  // Bug: returns only Concrete.sol 25:13-25:17 and 31:13-31:17, missing AbSquare.area (6:13-6:17).
  test.skip('bodiless function, from its declaration, includes an implementation below a base that does not redeclare it', async () => {
    const locations = await client.findImplementations(toUri(abShapesPath), makePosition(6, 13))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(abConcretePath), range: makeRange(6, 13, 6, 17) },
        { uri: toUri(abConcretePath), range: makeRange(25, 13, 25, 17) },
        { uri: toUri(abConcretePath), range: makeRange(31, 13, 31, 17) },
      ])
    )
  })

  // Bug: returns only Concrete.sol 25:13-25:17 and 31:13-31:17, missing AbSquare.area (6:13-6:17).
  test.skip('bodiless function, from a member call, includes an implementation below a base that does not redeclare it', async () => {
    const locations = await client.findImplementations(toUri(abConcretePath), makePosition(60, 21))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(abConcretePath), range: makeRange(6, 13, 6, 17) },
        { uri: toUri(abConcretePath), range: makeRange(25, 13, 25, 17) },
        { uri: toUri(abConcretePath), range: makeRange(31, 13, 31, 17) },
      ])
    )
  })

  // Bug: also returns the overridden base AbShape.describe, Shapes.sol 8:13-8:21.
  test.skip('super call to a middle override excludes the base it overrides', async () => {
    const locations = await client.findImplementations(toUri(abConcretePath), makePosition(11, 21))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(abShapesPath), range: makeRange(27, 13, 27, 21) },
        { uri: toUri(abConcretePath), range: makeRange(10, 13, 10, 21) },
      ])
    )
  })

  // Bug: also returns the other branch's AbLeft.tag, Concrete.sol 41:13-41:16.
  test.skip('super call in a diamond excludes the other branch', async () => {
    const locations = await client.findImplementations(toUri(abConcretePath), makePosition(54, 21))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(abConcretePath), range: makeRange(47, 13, 47, 16) },
        { uri: toUri(abConcretePath), range: makeRange(53, 13, 53, 16) },
      ])
    )
  })

  // Bug: returns only Impls.sol 8:13-8:17 and 14:13-14:17, missing IfcCircle.area (28:13-28:17).
  test.skip('interface function, from its declaration, includes an implementation below an abstract contract', async () => {
    const locations = await client.findImplementations(toUri(ifcShapesPath), makePosition(4, 13))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(ifcImplsPath), range: makeRange(8, 13, 8, 17) },
        { uri: toUri(ifcImplsPath), range: makeRange(14, 13, 14, 17) },
        { uri: toUri(ifcImplsPath), range: makeRange(28, 13, 28, 17) },
      ])
    )
  })

  // Bug: returns only Impls.sol 8:13-8:17 and 14:13-14:17, missing IfcCircle.area (28:13-28:17).
  test.skip('interface function, from a call through a cast, includes an implementation below an abstract contract', async () => {
    const locations = await client.findImplementations(toUri(ifcUsesPath), makePosition(8, 32))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(ifcImplsPath), range: makeRange(8, 13, 8, 17) },
        { uri: toUri(ifcImplsPath), range: makeRange(14, 13, 14, 17) },
        { uri: toUri(ifcImplsPath), range: makeRange(28, 13, 28, 17) },
      ])
    )
  })

  // Bug: also returns the set(uint256) overload, Impls.sol 41:13-41:16.
  test.skip('overloaded interface function, from its declaration, excludes the other overload', async () => {
    const locations = await client.findImplementations(toUri(ifcShapesPath), makePosition(18, 13))

    expect(sorted(locations)).to.deep.equal(sorted([{ uri: toUri(ifcImplsPath), range: makeRange(45, 13, 45, 16) }]))
  })

  // Bug: also returns the set(uint256) overload, Impls.sol 41:13-41:16; also needs the call bound to set(address), not the first-declared set(uint256).
  test.skip('overloaded interface function, from a call, excludes the other overload', async () => {
    const locations = await client.findImplementations(toUri(ifcUsesPath), makePosition(25, 16))

    expect(sorted(locations)).to.deep.equal(sorted([{ uri: toUri(ifcImplsPath), range: makeRange(45, 13, 45, 16) }]))
  })
})
