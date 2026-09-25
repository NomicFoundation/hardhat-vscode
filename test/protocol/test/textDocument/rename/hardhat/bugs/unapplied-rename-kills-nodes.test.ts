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

describe('[hardhat] rename bug - an unapplied rename kills the nodes it edits', () => {
  let defsPath: string
  let userPath: string

  before(async () => {
    client = await getInitializedClient()
    defsPath = getProjectPath('hardhat/contracts/definition/file-level/FileLevelDefs.sol')
    userPath = getProjectPath('hardhat/contracts/definition/file-level/FileLevelUser.sol')

    await client.openDocument(defsPath)
    await client.openDocument(userPath)
  })

  async function reopen() {
    await client.closeAllDocuments()
    await client.openDocument(defsPath)
    await client.openDocument(userPath)
  }

  afterEach(reopen)

  after(async () => {
    await client.closeAllDocuments()
  })

  // Bug: references return [] after the rename, until the files are analysed again.
  test('references on a free function after a rename that is never applied', async () => {
    const expected = sorted([
      { uri: toUri(defsPath), range: makeRange(19, 9, 19, 14) },
      { uri: toUri(defsPath), range: makeRange(24, 11, 24, 16) },
      { uri: toUri(defsPath), range: makeRange(24, 17, 24, 22) },
      { uri: toUri(defsPath), range: makeRange(46, 15, 46, 20) },
      { uri: toUri(userPath), range: makeRange(13, 33, 13, 38) },
    ])

    // The full set before the rename, so a failure after it can only be the rename's doing.
    expect(sorted(await client.findReferences(toUri(userPath), makePosition(13, 34)))).to.deep.equal(expected)

    // The edit is deliberately not applied, and the files are not reopened: a rename must not
    // change what the server knows.
    await client.rename(toUri(userPath), makePosition(13, 34), 'doubleIt')

    expect(sorted(await client.findReferences(toUri(userPath), makePosition(13, 34)))).to.deep.equal(expected)
  })
})
