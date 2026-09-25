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

describe('[hardhat3] references - assembly (not implemented)', () => {
  let refsPath: string
  let defsPath: string

  before(async () => {
    client = await getInitializedClient()
    refsPath = getProjectPath('hardhat3/contracts/references/assembly/AsmRefs.sol')
    defsPath = getProjectPath('hardhat3/contracts/definition/assembly/AssemblyDefs.sol')

    await client.openDocument(refsPath)
    await client.openDocument(defsPath)
  })

  after(async () => {
    await client.closeAllDocuments()
  })

  // Not implemented: returns only the declaration and the solidity use; the base of x.slot is not linked.
  test.skip('state variable used through .slot in assembly, from its declaration', async () => {
    const locations = await client.findReferences(toUri(refsPath), makePosition(5, 20))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(refsPath), range: makeRange(5, 20, 5, 26) },
        { uri: toUri(refsPath), range: makeRange(21, 8, 21, 14) },
        { uri: toUri(refsPath), range: makeRange(23, 19, 23, 25) },
        { uri: toUri(refsPath), range: makeRange(23, 42, 23, 48) },
      ])
    )
  })

  // Not implemented: returns []; the base of x.slot is not linked.
  test.skip('state variable used through .slot in assembly, from the .slot use', async () => {
    const locations = await client.findReferences(toUri(refsPath), makePosition(23, 42))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(refsPath), range: makeRange(5, 20, 5, 26) },
        { uri: toUri(refsPath), range: makeRange(21, 8, 21, 14) },
        { uri: toUri(refsPath), range: makeRange(23, 19, 23, 25) },
        { uri: toUri(refsPath), range: makeRange(23, 42, 23, 48) },
      ])
    )
  })

  // Not implemented: returns []; yul function parameters are not declarations.
  test.skip('yul function parameter, from its declaration', async () => {
    const locations = await client.findReferences(toUri(refsPath), makePosition(29, 28))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(refsPath), range: makeRange(29, 28, 29, 29) },
        { uri: toUri(refsPath), range: makeRange(30, 25, 30, 26) },
      ])
    )
  })

  // Not implemented: returns []; yul function return variables are not declarations.
  test.skip('yul function return variable, from its use', async () => {
    const locations = await client.findReferences(toUri(refsPath), makePosition(30, 16))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(refsPath), range: makeRange(29, 34, 29, 35) },
        { uri: toUri(refsPath), range: makeRange(30, 16, 30, 17) },
      ])
    )
  })

  // Not implemented: returns only the declaration; the base of xs.offset and xs.length is not linked.
  test.skip('calldata array used through .offset and .length in assembly', async () => {
    const locations = await client.findReferences(toUri(defsPath), makePosition(24, 46))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(defsPath), range: makeRange(24, 46, 24, 48) },
        { uri: toUri(defsPath), range: makeRange(26, 17, 26, 19) },
        { uri: toUri(defsPath), range: makeRange(27, 17, 27, 19) },
      ])
    )
  })

  // Not implemented: returns only the declaration; the base of fp.address and fp.selector is not linked.
  test.skip('function pointer used through .address and .selector in assembly', async () => {
    const locations = await client.findReferences(toUri(defsPath), makePosition(52, 33))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(defsPath), range: makeRange(52, 33, 52, 35) },
        { uri: toUri(defsPath), range: makeRange(54, 17, 54, 19) },
        { uri: toUri(defsPath), range: makeRange(55, 17, 55, 19) },
      ])
    )
  })
})
