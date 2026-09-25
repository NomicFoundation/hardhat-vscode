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

describe('[hardhat3] typeDefinition - udvt-using', () => {
  let pricePath: string
  let vaultPath: string

  before(async () => {
    client = await getInitializedClient()
    pricePath = getProjectPath('hardhat3/contracts/type-definition/udvt-using/UuPrice.sol')
    vaultPath = getProjectPath('hardhat3/contracts/type-definition/udvt-using/UuVault.sol')

    await client.openDocument(pricePath)
    await client.openDocument(vaultPath)
  })

  after(async () => {
    await client.closeAllDocuments()
  })

  test('udvt state variable at its declaration', async () => {
    const locations = await client.findTypeDefinition(toUri(vaultPath), makePosition(28, 19))

    expect(sorted(locations)).to.deep.equal(sorted([{ uri: toUri(pricePath), range: makeRange(3, 5, 3, 12) }]))
  })

  test('udvt state variable at a use', async () => {
    const locations = await client.findTypeDefinition(toUri(vaultPath), makePosition(35, 8))

    expect(sorted(locations)).to.deep.equal(sorted([{ uri: toUri(pricePath), range: makeRange(3, 5, 3, 12) }]))
  })

  test('udvt local at its declaration', async () => {
    const locations = await client.findTypeDefinition(toUri(vaultPath), makePosition(34, 16))

    expect(sorted(locations)).to.deep.equal(sorted([{ uri: toUri(pricePath), range: makeRange(3, 5, 3, 12) }]))
  })

  test('mapping with a udvt value at a use', async () => {
    const locations = await client.findTypeDefinition(toUri(vaultPath), makePosition(36, 8))

    expect(sorted(locations)).to.deep.equal(sorted([{ uri: toUri(pricePath), range: makeRange(3, 5, 3, 12) }]))
  })

  test('state variable of a udvt declared in the contract', async () => {
    const locations = await client.findTypeDefinition(toUri(vaultPath), makePosition(52, 8))

    expect(sorted(locations)).to.deep.equal(sorted([{ uri: toUri(vaultPath), range: makeRange(18, 9, 18, 15) }]))
  })

  test('udvt struct member through member access', async () => {
    const locations = await client.findTypeDefinition(toUri(vaultPath), makePosition(60, 20))

    expect(sorted(locations)).to.deep.equal(sorted([{ uri: toUri(pricePath), range: makeRange(3, 5, 3, 12) }]))
  })
})
