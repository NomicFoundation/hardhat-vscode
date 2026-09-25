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

describe('[foundry] references bug - errors never resolve through a qualified name', () => {
  if (shouldSkipFoundryTests()) {
    return
  }

  let basePath: string
  let errorsEventsPath: string

  before(async () => {
    client = await getInitializedClient()
    basePath = getProjectPath('foundry/src/definition/errors-events/Base.sol')
    errorsEventsPath = getProjectPath('foundry/src/definition/errors-events/ErrorsEvents.sol')

    await client.openDocument(basePath)
    await client.openDocument(errorsEventsPath)
  })

  after(async () => {
    await client.closeAllDocuments()
  })

  // Bug: returns only the declaration and the unqualified revert, not IEEVault.Unauthorized.selector (34:42).
  test.skip('interface error from its declaration, used through a qualified selector', async () => {
    const locations = await client.findReferences(toUri(basePath), makePosition(4, 11))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(basePath), range: makeRange(4, 10, 4, 22) },
        { uri: toUri(errorsEventsPath), range: makeRange(29, 40, 29, 52) },
        { uri: toUri(errorsEventsPath), range: makeRange(34, 42, 34, 54) },
      ])
    )
  })

  // Bug: returns only the declaration and the unqualified revert, not IEEVault.Unauthorized.selector (34:42).
  test.skip('interface error from a revert, used through a qualified selector', async () => {
    const locations = await client.findReferences(toUri(errorsEventsPath), makePosition(29, 41))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(basePath), range: makeRange(4, 10, 4, 22) },
        { uri: toUri(errorsEventsPath), range: makeRange(29, 40, 29, 52) },
        { uri: toUri(errorsEventsPath), range: makeRange(34, 42, 34, 54) },
      ])
    )
  })

  // Bug: returns only the declaration and the require use, not revert EEVaultBase.InsufficientBalance (44:27).
  test.skip('base error from its declaration, used through a qualified revert', async () => {
    const locations = await client.findReferences(toUri(basePath), makePosition(9, 11))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(basePath), range: makeRange(9, 10, 9, 29) },
        { uri: toUri(errorsEventsPath), range: makeRange(23, 48, 23, 67) },
        { uri: toUri(errorsEventsPath), range: makeRange(44, 27, 44, 46) },
      ])
    )
  })

  // Bug: returns only the declaration and the require use, not revert EEVaultBase.InsufficientBalance (44:27).
  test.skip('base error from a require, used through a qualified revert', async () => {
    const locations = await client.findReferences(toUri(errorsEventsPath), makePosition(23, 49))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(basePath), range: makeRange(9, 10, 9, 29) },
        { uri: toUri(errorsEventsPath), range: makeRange(23, 48, 23, 67) },
        { uri: toUri(errorsEventsPath), range: makeRange(44, 27, 44, 46) },
      ])
    )
  })
})
