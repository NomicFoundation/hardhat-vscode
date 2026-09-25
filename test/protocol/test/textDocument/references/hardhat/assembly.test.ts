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

describe('[hardhat] references - assembly', () => {
  let refsPath: string
  let transientPath: string
  let defsPath: string

  before(async () => {
    client = await getInitializedClient()
    refsPath = getProjectPath('hardhat/contracts/references/assembly/AsmRefs.sol')
    transientPath = getProjectPath('hardhat/contracts/references/assembly/TransientDefs.sol')
    defsPath = getProjectPath('hardhat/contracts/definition/assembly/AssemblyDefs.sol')

    await client.openDocument(refsPath)
    await client.openDocument(transientPath)
    await client.openDocument(defsPath)
  })

  after(async () => {
    await client.closeAllDocuments()
  })

  test('solidity parameter used in solidity and in assembly, from its declaration', async () => {
    const locations = await client.findReferences(toUri(refsPath), makePosition(7, 27))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(refsPath), range: makeRange(7, 27, 7, 31) },
        { uri: toUri(refsPath), range: makeRange(8, 25, 8, 29) },
        { uri: toUri(refsPath), range: makeRange(12, 25, 12, 29) },
        { uri: toUri(refsPath), range: makeRange(14, 24, 14, 28) },
      ])
    )
  })

  test('solidity parameter used in solidity and in assembly, from its use in assembly', async () => {
    const locations = await client.findReferences(toUri(refsPath), makePosition(12, 25))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(refsPath), range: makeRange(7, 27, 7, 31) },
        { uri: toUri(refsPath), range: makeRange(8, 25, 8, 29) },
        { uri: toUri(refsPath), range: makeRange(12, 25, 12, 29) },
        { uri: toUri(refsPath), range: makeRange(14, 24, 14, 28) },
      ])
    )
  })

  test('constant used in solidity and in assembly, from its use in assembly', async () => {
    const locations = await client.findReferences(toUri(refsPath), makePosition(16, 32))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(refsPath), range: makeRange(4, 29, 4, 35) },
        { uri: toUri(refsPath), range: makeRange(8, 32, 8, 38) },
        { uri: toUri(refsPath), range: makeRange(16, 32, 16, 38) },
      ])
    )
  })

  test('yul let variable excludes a same-named one in another assembly block', async () => {
    const locations = await client.findReferences(toUri(refsPath), makePosition(43, 17))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(refsPath), range: makeRange(42, 16, 42, 19) },
        { uri: toUri(refsPath), range: makeRange(43, 17, 43, 20) },
      ])
    )
  })

  test('yul for-loop init variable, from its declaration', async () => {
    const locations = await client.findReferences(toUri(defsPath), makePosition(38, 22))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(defsPath), range: makeRange(38, 22, 38, 23) },
        { uri: toUri(defsPath), range: makeRange(38, 34, 38, 35) },
        { uri: toUri(defsPath), range: makeRange(38, 42, 38, 43) },
        { uri: toUri(defsPath), range: makeRange(38, 51, 38, 52) },
        { uri: toUri(defsPath), range: makeRange(39, 35, 39, 36) },
      ])
    )
  })

  test('constant used in tstore and tload', async () => {
    const locations = await client.findReferences(toUri(transientPath), makePosition(9, 26))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(transientPath), range: makeRange(4, 29, 4, 38) },
        { uri: toUri(transientPath), range: makeRange(8, 19, 8, 28) },
        { uri: toUri(transientPath), range: makeRange(9, 26, 9, 35) },
      ])
    )
  })
})
