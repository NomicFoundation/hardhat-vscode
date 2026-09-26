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

describe('[foundry] references bug - events resolve only under emit', () => {
  if (shouldSkipFoundryTests()) {
    return
  }

  let errorsEventsPath: string
  let userPath: string

  before(async () => {
    client = await getInitializedClient()
    errorsEventsPath = getProjectPath('foundry/src/definition/errors-events/ErrorsEvents.sol')
    userPath = getProjectPath('foundry/src/references/errors-events/User.sol')

    await client.openDocument(errorsEventsPath)
    await client.openDocument(userPath)
  })

  after(async () => {
    await client.closeAllDocuments()
  })

  // Bug: returns the declaration and the emit, not Paused.selector (34:16).
  test.skip('local event from its declaration, used in a selector', async () => {
    const locations = await client.findReferences(toUri(errorsEventsPath), makePosition(7, 11))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(errorsEventsPath), range: makeRange(7, 10, 7, 16) },
        { uri: toUri(errorsEventsPath), range: makeRange(30, 13, 30, 19) },
        { uri: toUri(errorsEventsPath), range: makeRange(34, 16, 34, 22) },
      ])
    )
  })

  // Bug: returns the declaration and the emit, not Paused.selector (34:16).
  test.skip('local event from an emit, used in a selector', async () => {
    const locations = await client.findReferences(toUri(errorsEventsPath), makePosition(30, 14))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(errorsEventsPath), range: makeRange(7, 10, 7, 16) },
        { uri: toUri(errorsEventsPath), range: makeRange(30, 13, 30, 19) },
        { uri: toUri(errorsEventsPath), range: makeRange(34, 16, 34, 22) },
      ])
    )
  })

  // Bug: returns the declaration and the emit, not Moved.selector (17:16).
  test.skip('event shadowing a same-named one elsewhere, from its declaration', async () => {
    const locations = await client.findReferences(toUri(userPath), makePosition(7, 11))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(userPath), range: makeRange(7, 10, 7, 15) },
        { uri: toUri(userPath), range: makeRange(13, 13, 13, 18) },
        { uri: toUri(userPath), range: makeRange(17, 16, 17, 21) },
      ])
    )
  })

  // Bug: returns no locations.
  test.skip('event from its selector', async () => {
    const locations = await client.findReferences(toUri(userPath), makePosition(17, 17))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(userPath), range: makeRange(7, 10, 7, 15) },
        { uri: toUri(userPath), range: makeRange(13, 13, 13, 18) },
        { uri: toUri(userPath), range: makeRange(17, 16, 17, 21) },
      ])
    )
  })
})
