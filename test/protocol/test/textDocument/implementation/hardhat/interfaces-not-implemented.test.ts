import { expect } from 'chai'
import { test } from 'mocha'
import { Definition, DefinitionLink, Location } from 'vscode-languageserver-protocol'
import { toUri } from '../../../../src/helpers'
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

describe('[hardhat] implementation - interfaces (not implemented)', () => {
  let shapesPath: string
  let implsPath: string
  let usesPath: string

  before(async () => {
    client = await getInitializedClient()
    shapesPath = getProjectPath('hardhat/contracts/implementation/interfaces/Shapes.sol')
    implsPath = getProjectPath('hardhat/contracts/implementation/interfaces/Impls.sol')
    usesPath = getProjectPath('hardhat/contracts/implementation/interfaces/Uses.sol')

    await client.openDocument(shapesPath)
    await client.openDocument(implsPath)
    await client.openDocument(usesPath)
  })

  after(async () => {
    await client.closeAllDocuments()
  })

  // Not implemented: returns nothing.
  test.skip('public state variable implementing an interface getter', async () => {
    const locations = await client.findImplementations(toUri(shapesPath), makePosition(12, 13))

    expect(sorted(locations)).to.deep.equal(sorted([{ uri: toUri(implsPath), range: makeRange(34, 28, 34, 33) }]))
  })

  // Not implemented: returns nothing.
  test.skip('interface getter called, implemented by a public state variable', async () => {
    const locations = await client.findImplementations(toUri(usesPath), makePosition(26, 23))

    expect(sorted(locations)).to.deep.equal(sorted([{ uri: toUri(implsPath), range: makeRange(34, 28, 34, 33) }]))
  })

  // Not implemented: returns the interface name and its uses as a type name (parameter type, is lists), no implementing contract.
  test.skip('interface name gives the contracts implementing it, directly or transitively', async () => {
    const locations = await client.findImplementations(toUri(shapesPath), makePosition(3, 10))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(implsPath), range: makeRange(5, 9, 5, 18) },
        { uri: toUri(implsPath), range: makeRange(13, 9, 13, 21) },
        { uri: toUri(implsPath), range: makeRange(27, 9, 27, 18) },
      ])
    )
  })

  // Not implemented: returns the interface name and its uses as a type name (parameter type, is lists), no implementing contract.
  test.skip('interface in an is list gives the contracts implementing it', async () => {
    const locations = await client.findImplementations(toUri(implsPath), makePosition(5, 22))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(implsPath), range: makeRange(5, 9, 5, 18) },
        { uri: toUri(implsPath), range: makeRange(13, 9, 13, 21) },
        { uri: toUri(implsPath), range: makeRange(27, 9, 27, 18) },
      ])
    )
  })

  // Not implemented: returns the interface name and the is IfcScaled entry in IfcPartial, no implementing contract.
  test.skip('child interface in a cast gives the contract implementing it through an abstract base', async () => {
    const locations = await client.findImplementations(toUri(usesPath), makePosition(20, 8))

    expect(sorted(locations)).to.deep.equal(sorted([{ uri: toUri(implsPath), range: makeRange(27, 9, 27, 18) }]))
  })
})
