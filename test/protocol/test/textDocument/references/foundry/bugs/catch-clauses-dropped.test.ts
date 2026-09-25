import { expect } from 'chai'
import { test } from 'mocha'
import { Location } from 'vscode-languageserver-protocol'
import { shouldSkipFoundryTests, toUri } from '../../../../../src/helpers'
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

describe('[foundry] references bug - catch clauses after the first are dropped', () => {
  if (shouldSkipFoundryTests()) {
    return
  }

  let tryCatchPath: string

  before(async () => {
    client = await getInitializedClient()
    tryCatchPath = getProjectPath('foundry/src/definition/errors-events/TryCatch.sol')

    await client.openDocument(tryCatchPath)
  })

  after(async () => {
    await client.closeAllDocuments()
  })

  // Bug: returns no locations.
  test.skip('panic catch clause parameter from its declaration', async () => {
    const locations = await client.findReferences(toUri(tryCatchPath), makePosition(17, 31))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(tryCatchPath), range: makeRange(17, 30, 17, 39) },
        { uri: toUri(tryCatchPath), range: makeRange(18, 19, 18, 28) },
      ])
    )
  })
})
