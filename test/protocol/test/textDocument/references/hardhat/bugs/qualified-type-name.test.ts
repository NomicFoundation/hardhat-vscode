import { expect } from 'chai'
import { test } from 'mocha'
import { Location } from 'vscode-languageserver-protocol'
import { toUri } from '../../../../../src/helpers'
import { TestLanguageClient } from '../../../../../src/TestLanguageClient'
import { getInitializedClient } from '../../../../client'
import { getProjectPath, makePosition, makeRange } from '../../../../helpers'

let client!: TestLanguageClient

// References come in no particular order: compare them as sets.
function sorted(locations: Location[]) {
  return [...locations].sort(
    (a, b) =>
      a.uri.localeCompare(b.uri) ||
      a.range.start.line - b.range.start.line ||
      a.range.start.character - b.range.start.character
  )
}

describe('[hardhat] references bug - qualified type name looked up as one dotted name', () => {
  let vaultPath: string

  before(async () => {
    client = await getInitializedClient()
    vaultPath = getProjectPath('hardhat/contracts/definition/udvt-using/Vault.sol')

    await client.openDocument(vaultPath)
  })

  after(async () => {
    await client.closeAllDocuments()
  })

  // Bug: returns the declaration and the unqualified uses; the qualified uses Vault.Shares are missing.
  test.skip('user-defined value type in a contract, from its declaration', async () => {
    const locations = await client.findReferences(toUri(vaultPath), makePosition(20, 9))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(vaultPath), range: makeRange(20, 9, 20, 15) },
        { uri: toUri(vaultPath), range: makeRange(24, 24, 24, 30) },
        { uri: toUri(vaultPath), range: makeRange(26, 4, 26, 10) },
        { uri: toUri(vaultPath), range: makeRange(37, 17, 37, 23) },
        { uri: toUri(vaultPath), range: makeRange(37, 29, 37, 35) },
        { uri: toUri(vaultPath), range: makeRange(46, 26, 46, 32) },
        { uri: toUri(vaultPath), range: makeRange(47, 21, 47, 27) },
        { uri: toUri(vaultPath), range: makeRange(52, 24, 52, 30) },
        { uri: toUri(vaultPath), range: makeRange(53, 21, 53, 27) },
      ])
    )
  })

  // Bug: returns no locations; the qualified name Vault.Shares is looked up as one name.
  test.skip('user-defined value type in a contract, from a qualified use', async () => {
    const locations = await client.findReferences(toUri(vaultPath), makePosition(52, 24))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(vaultPath), range: makeRange(20, 9, 20, 15) },
        { uri: toUri(vaultPath), range: makeRange(24, 24, 24, 30) },
        { uri: toUri(vaultPath), range: makeRange(26, 4, 26, 10) },
        { uri: toUri(vaultPath), range: makeRange(37, 17, 37, 23) },
        { uri: toUri(vaultPath), range: makeRange(37, 29, 37, 35) },
        { uri: toUri(vaultPath), range: makeRange(46, 26, 46, 32) },
        { uri: toUri(vaultPath), range: makeRange(47, 21, 47, 27) },
        { uri: toUri(vaultPath), range: makeRange(52, 24, 52, 30) },
        { uri: toUri(vaultPath), range: makeRange(53, 21, 53, 27) },
      ])
    )
  })
})
