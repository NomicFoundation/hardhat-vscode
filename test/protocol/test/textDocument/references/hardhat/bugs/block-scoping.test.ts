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

describe('[hardhat] references bug - blocks do not open a scope', () => {
  let localsPath: string

  before(async () => {
    client = await getInitializedClient()
    localsPath = getProjectPath('hardhat/contracts/references/variables/RvLocals.sol')

    await client.openDocument(localsPath)
  })

  after(async () => {
    await client.closeAllDocuments()
  })

  // Bug: also returns the else block's use of its own k2 (39:16-39:18).
  test.skip('local in an if block, not the same-named local in the else block', async () => {
    const locations = await client.findReferences(toUri(localsPath), makePosition(35, 20))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(localsPath), range: makeRange(35, 20, 35, 22) },
        { uri: toUri(localsPath), range: makeRange(36, 16, 36, 18) },
        { uri: toUri(localsPath), range: makeRange(36, 21, 36, 23) },
      ])
    )
  })
})
