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

describe('[hardhat3] references bug - free function imported by name in braces is never bound', () => {
  let flDefsPath: string
  let flUserPath: string
  let ifBasePath: string
  let ifUserAPath: string
  let ifUserBPath: string

  before(async () => {
    client = await getInitializedClient()
    flDefsPath = getProjectPath('hardhat3/contracts/references/file-level/FlRefDefs.sol')
    flUserPath = getProjectPath('hardhat3/contracts/references/file-level/FlRefUser.sol')
    ifBasePath = getProjectPath('hardhat3/contracts/references/import-forms/IfBase.sol')
    ifUserAPath = getProjectPath('hardhat3/contracts/references/import-forms/IfUserA.sol')
    ifUserBPath = getProjectPath('hardhat3/contracts/references/import-forms/IfUserB.sol')

    await client.openDocument(flDefsPath)
    await client.openDocument(flUserPath)
    await client.openDocument(ifBasePath)
    await client.openDocument(ifUserAPath)
    await client.openDocument(ifUserBPath)
  })

  after(async () => {
    await client.closeAllDocuments()
  })

  // Bug: returns only the three locations in the declaring file; the {flScale} import and its uses are not linked.
  test.skip('free function imported with {f}, from its declaration', async () => {
    const locations = await client.findReferences(toUri(flDefsPath), makePosition(6, 10))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(flDefsPath), range: makeRange(6, 9, 6, 16) },
        { uri: toUri(flDefsPath), range: makeRange(11, 11, 11, 18) },
        { uri: toUri(flDefsPath), range: makeRange(11, 19, 11, 26) },
        { uri: toUri(flUserPath), range: makeRange(3, 28, 3, 35) },
        { uri: toUri(flUserPath), range: makeRange(6, 33, 6, 40) },
        { uri: toUri(flUserPath), range: makeRange(11, 15, 11, 22) },
      ])
    )
  })

  // Bug: returns an empty list; the {flScale} import is never bound, so the call is linked to nothing.
  test.skip('free function imported with {f}, from a call in the importing file', async () => {
    const locations = await client.findReferences(toUri(flUserPath), makePosition(11, 16))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(flDefsPath), range: makeRange(6, 9, 6, 16) },
        { uri: toUri(flDefsPath), range: makeRange(11, 11, 11, 18) },
        { uri: toUri(flDefsPath), range: makeRange(11, 19, 11, 26) },
        { uri: toUri(flUserPath), range: makeRange(3, 28, 3, 35) },
        { uri: toUri(flUserPath), range: makeRange(6, 33, 6, 40) },
        { uri: toUri(flUserPath), range: makeRange(11, 15, 11, 22) },
      ])
    )
  })

  // Bug: returns only the declaration; the {ifDouble} and {ifDouble as twice} imports and their calls are not linked.
  test.skip('free function imported with {f} by a contract, from its declaration', async () => {
    const locations = await client.findReferences(toUri(ifBasePath), makePosition(7, 10))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(ifBasePath), range: makeRange(7, 9, 7, 17) },
        { uri: toUri(ifUserAPath), range: makeRange(3, 17, 3, 25) },
        { uri: toUri(ifUserAPath), range: makeRange(12, 15, 12, 23) },
        { uri: toUri(ifUserBPath), range: makeRange(3, 26, 3, 34) },
        { uri: toUri(ifUserBPath), range: makeRange(3, 38, 3, 43) },
        { uri: toUri(ifUserBPath), range: makeRange(10, 15, 10, 20) },
        { uri: toUri(ifUserBPath), range: makeRange(10, 21, 10, 26) },
      ])
    )
  })

  // Bug: returns an empty list; the {ifDouble as twice} import is never bound, so the call is linked to nothing.
  test.skip('free function imported with {f as g}, from a call through the alias', async () => {
    const locations = await client.findReferences(toUri(ifUserBPath), makePosition(10, 21))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(ifBasePath), range: makeRange(7, 9, 7, 17) },
        { uri: toUri(ifUserAPath), range: makeRange(3, 17, 3, 25) },
        { uri: toUri(ifUserAPath), range: makeRange(12, 15, 12, 23) },
        { uri: toUri(ifUserBPath), range: makeRange(3, 26, 3, 34) },
        { uri: toUri(ifUserBPath), range: makeRange(3, 38, 3, 43) },
        { uri: toUri(ifUserBPath), range: makeRange(10, 15, 10, 20) },
        { uri: toUri(ifUserBPath), range: makeRange(10, 21, 10, 26) },
      ])
    )
  })
})
