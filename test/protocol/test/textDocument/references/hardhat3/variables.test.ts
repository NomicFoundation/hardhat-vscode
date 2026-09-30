import { expect } from 'chai'
import { test } from 'mocha'
import { Location } from 'vscode-languageserver-protocol'
import { toUri } from '../../../../src/helpers'
import { TestLanguageClient } from '../../../../src/TestLanguageClient'
import { getInitializedClient } from '../../../client'
import { getProjectPath, makePosition, makeRange } from '../../../helpers'

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

describe('[hardhat3] references - variables', () => {
  let basePath: string
  let vaultPath: string
  let localsPath: string
  let transientPath: string

  before(async () => {
    client = await getInitializedClient()
    basePath = getProjectPath('hardhat3/contracts/references/variables/RvBase.sol')
    vaultPath = getProjectPath('hardhat3/contracts/references/variables/RvVault.sol')
    localsPath = getProjectPath('hardhat3/contracts/references/variables/RvLocals.sol')
    transientPath = getProjectPath('hardhat3/contracts/references/variables/RvTransient.sol')

    await client.openDocument(basePath)
    await client.openDocument(vaultPath)
    await client.openDocument(localsPath)
    await client.openDocument(transientPath)
  })

  after(async () => {
    await client.closeAllDocuments()
  })

  test('modifier used in another file, from its declaration', async () => {
    const locations = await client.findReferences(toUri(basePath), makePosition(12, 13))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(basePath), range: makeRange(12, 13, 12, 22) },
        { uri: toUri(vaultPath), range: makeRange(6, 46, 6, 55) },
        { uri: toUri(vaultPath), range: makeRange(10, 47, 10, 56) },
      ])
    )
  })

  test('modifier used in another file, from an invocation', async () => {
    const locations = await client.findReferences(toUri(vaultPath), makePosition(10, 47))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(basePath), range: makeRange(12, 13, 12, 22) },
        { uri: toUri(vaultPath), range: makeRange(6, 46, 6, 55) },
        { uri: toUri(vaultPath), range: makeRange(10, 47, 10, 56) },
      ])
    )
  })

  test('modifier parameter, not a same-named function parameter', async () => {
    const locations = await client.findReferences(toUri(basePath), makePosition(20, 16))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(basePath), range: makeRange(17, 43, 17, 49) },
        { uri: toUri(basePath), range: makeRange(19, 16, 19, 22) },
        { uri: toUri(basePath), range: makeRange(20, 16, 20, 22) },
      ])
    )
  })

  test('function parameter passed as a modifier argument', async () => {
    const locations = await client.findReferences(toUri(vaultPath), makePosition(7, 32))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(vaultPath), range: makeRange(6, 29, 6, 35) },
        { uri: toUri(vaultPath), range: makeRange(6, 75, 6, 81) },
        { uri: toUri(vaultPath), range: makeRange(7, 19, 7, 25) },
        { uri: toUri(vaultPath), range: makeRange(7, 32, 7, 38) },
      ])
    )
  })

  test('inherited state variable, from its declaration', async () => {
    const locations = await client.findReferences(toUri(basePath), makePosition(5, 21))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(basePath), range: makeRange(5, 21, 5, 28) },
        { uri: toUri(vaultPath), range: makeRange(7, 8, 7, 15) },
        { uri: toUri(vaultPath), range: makeRange(10, 64, 10, 71) },
        { uri: toUri(vaultPath), range: makeRange(11, 8, 11, 15) },
      ])
    )
  })

  test('inherited state variable, from a modifier argument', async () => {
    const locations = await client.findReferences(toUri(vaultPath), makePosition(10, 64))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(basePath), range: makeRange(5, 21, 5, 28) },
        { uri: toUri(vaultPath), range: makeRange(7, 8, 7, 15) },
        { uri: toUri(vaultPath), range: makeRange(10, 64, 10, 71) },
        { uri: toUri(vaultPath), range: makeRange(11, 8, 11, 15) },
      ])
    )
  })

  test('immutable, from its constructor assignment', async () => {
    const locations = await client.findReferences(toUri(basePath), makePosition(9, 8))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(basePath), range: makeRange(6, 31, 6, 36) },
        { uri: toUri(basePath), range: makeRange(9, 8, 9, 13) },
        { uri: toUri(basePath), range: makeRange(13, 30, 13, 35) },
        { uri: toUri(vaultPath), range: makeRange(15, 22, 15, 27) },
      ])
    )
  })

  test('constant used plainly and through the contract name', async () => {
    const locations = await client.findReferences(toUri(vaultPath), makePosition(6, 70))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(basePath), range: makeRange(4, 30, 4, 33) },
        { uri: toUri(basePath), range: makeRange(18, 25, 18, 28) },
        { uri: toUri(vaultPath), range: makeRange(6, 70, 6, 73) },
      ])
    )
  })

  test('state variable, not the local that shadows it', async () => {
    const locations = await client.findReferences(toUri(localsPath), makePosition(14, 15))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(localsPath), range: makeRange(4, 19, 4, 24) },
        { uri: toUri(localsPath), range: makeRange(10, 8, 10, 13) },
        { uri: toUri(localsPath), range: makeRange(14, 15, 14, 20) },
      ])
    )
  })

  test('local that shadows a state variable', async () => {
    const locations = await client.findReferences(toUri(localsPath), makePosition(18, 16))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(localsPath), range: makeRange(18, 16, 18, 21) },
        { uri: toUri(localsPath), range: makeRange(19, 8, 19, 13) },
        { uri: toUri(localsPath), range: makeRange(20, 15, 20, 20) },
      ])
    )
  })

  test('for loop variable', async () => {
    const locations = await client.findReferences(toUri(localsPath), makePosition(8, 22))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(localsPath), range: makeRange(7, 21, 7, 22) },
        { uri: toUri(localsPath), range: makeRange(7, 28, 7, 29) },
        { uri: toUri(localsPath), range: makeRange(7, 43, 7, 44) },
        { uri: toUri(localsPath), range: makeRange(8, 22, 8, 23) },
      ])
    )
  })

  test('named return variable, including inside unchecked', async () => {
    const locations = await client.findReferences(toUri(localsPath), makePosition(23, 61))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(localsPath), range: makeRange(23, 61, 23, 63) },
        { uri: toUri(localsPath), range: makeRange(25, 8, 25, 10) },
        { uri: toUri(localsPath), range: makeRange(28, 12, 28, 14) },
        { uri: toUri(localsPath), range: makeRange(28, 17, 28, 19) },
      ])
    )
  })

  test('outer local used inside if and else blocks (right only because blocks are not scopes)', async () => {
    const locations = await client.findReferences(toUri(localsPath), makePosition(41, 19))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(localsPath), range: makeRange(33, 16, 33, 17) },
        { uri: toUri(localsPath), range: makeRange(35, 25, 35, 26) },
        { uri: toUri(localsPath), range: makeRange(38, 25, 38, 26) },
        { uri: toUri(localsPath), range: makeRange(41, 19, 41, 20) },
      ])
    )
  })

  test('transient state variable', async () => {
    const locations = await client.findReferences(toUri(transientPath), makePosition(6, 22))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(transientPath), range: makeRange(6, 22, 6, 29) },
        { uri: toUri(transientPath), range: makeRange(17, 8, 17, 15) },
        { uri: toUri(transientPath), range: makeRange(18, 15, 18, 22) },
      ])
    )
  })
})
