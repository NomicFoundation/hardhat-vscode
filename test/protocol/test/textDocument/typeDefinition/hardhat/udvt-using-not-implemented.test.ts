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

describe('[hardhat] typeDefinition - udvt-using (not implemented)', () => {
  let pricePath: string
  let vaultPath: string

  before(async () => {
    client = await getInitializedClient()
    pricePath = getProjectPath('hardhat/contracts/type-definition/udvt-using/UuPrice.sol')
    vaultPath = getProjectPath('hardhat/contracts/type-definition/udvt-using/UuVault.sol')

    await client.openDocument(pricePath)
    await client.openDocument(vaultPath)
  })

  after(async () => {
    await client.closeAllDocuments()
  })

  // Not implemented: returns no locations.
  test.skip('function attached by a global using directive, at its call', async () => {
    const locations = await client.findTypeDefinition(toUri(vaultPath), makePosition(44, 21))

    expect(sorted(locations)).to.deep.equal(sorted([{ uri: toUri(pricePath), range: makeRange(3, 5, 3, 12) }]))
  })

  // Not implemented: returns no locations.
  test.skip('library function attached to uint256 returning a udvt, at its call', async () => {
    const locations = await client.findTypeDefinition(toUri(vaultPath), makePosition(48, 35))

    expect(sorted(locations)).to.deep.equal(sorted([{ uri: toUri(pricePath), range: makeRange(3, 5, 3, 12) }]))
  })

  // Not implemented: returns no locations.
  test.skip('library function attached to a contract-level udvt, at its call', async () => {
    const locations = await client.findTypeDefinition(toUri(vaultPath), makePosition(56, 22))

    expect(sorted(locations)).to.deep.equal(sorted([{ uri: toUri(pricePath), range: makeRange(3, 5, 3, 12) }]))
  })
})
