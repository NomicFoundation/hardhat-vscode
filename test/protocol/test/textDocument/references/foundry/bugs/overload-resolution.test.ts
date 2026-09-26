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

describe('[foundry] references bug - overload resolution', () => {
  if (shouldSkipFoundryTests()) {
    return
  }

  let functionsPath: string
  let refsPath: string
  let logPath: string
  let userPath: string

  before(async () => {
    client = await getInitializedClient()
    functionsPath = getProjectPath('foundry/src/definition/functions/Functions.sol')
    refsPath = getProjectPath('foundry/src/references/bugs/overload-resolution/FunctionRefs.sol')
    logPath = getProjectPath('foundry/src/references/errors-events/Log.sol')
    userPath = getProjectPath('foundry/src/references/errors-events/User.sol')

    await client.openDocument(functionsPath)
    await client.openDocument(refsPath)
    await client.openDocument(logPath)
    await client.openDocument(userPath)
  })

  after(async () => {
    await client.closeAllDocuments()
  })

  // Bug: also returns add(1) at 29:22, which calls the one-parameter overload.
  test.skip('two-parameter overload, from its declaration', async () => {
    const locations = await client.findReferences(toUri(functionsPath), makePosition(8, 13))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(functionsPath), range: makeRange(8, 13, 8, 16) },
        { uri: toUri(functionsPath), range: makeRange(30, 22, 30, 25) },
        { uri: toUri(functionsPath), range: makeRange(31, 24, 31, 27) },
        { uri: toUri(functionsPath), range: makeRange(53, 20, 53, 23) },
      ])
    )
  })

  // Bug: also returns add(1) at 29:22, which calls the one-parameter overload.
  test.skip('two-parameter overload, from a call', async () => {
    const locations = await client.findReferences(toUri(functionsPath), makePosition(30, 22))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(functionsPath), range: makeRange(8, 13, 8, 16) },
        { uri: toUri(functionsPath), range: makeRange(30, 22, 30, 25) },
        { uri: toUri(functionsPath), range: makeRange(31, 24, 31, 27) },
        { uri: toUri(functionsPath), range: makeRange(53, 20, 53, 23) },
      ])
    )
  })

  // Bug: returns only the declaration; add(1) is linked to the two-parameter overload.
  test.skip('one-parameter overload, from its declaration', async () => {
    const locations = await client.findReferences(toUri(functionsPath), makePosition(12, 13))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(functionsPath), range: makeRange(12, 13, 12, 16) },
        { uri: toUri(functionsPath), range: makeRange(29, 22, 29, 25) },
      ])
    )
  })

  // Bug: returns the two-parameter overload's set, 8:13, 29:22, 30:22, 31:24 and 53:20.
  test.skip('one-parameter overload, from a call', async () => {
    const locations = await client.findReferences(toUri(functionsPath), makePosition(29, 22))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(functionsPath), range: makeRange(12, 13, 12, 16) },
        { uri: toUri(functionsPath), range: makeRange(29, 22, 29, 25) },
      ])
    )
  })

  // Bug: returns record(msg.sender) at 22:8 and omits the call at 13:15, which is bound to the function it sits in.
  test.skip('overload told apart by parameter type, from its declaration', async () => {
    const locations = await client.findReferences(toUri(refsPath), makePosition(7, 13))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(refsPath), range: makeRange(7, 13, 7, 19) },
        { uri: toUri(refsPath), range: makeRange(13, 15, 13, 21) },
        { uri: toUri(refsPath), range: makeRange(23, 8, 23, 14) },
        { uri: toUri(refsPath), range: makeRange(34, 22, 34, 28) },
      ])
    )
  })

  // Bug: returns record(msg.sender) at 22:8 and omits the call at 13:15, which is bound to the function it sits in.
  test.skip('overload told apart by parameter type, from a member call', async () => {
    const locations = await client.findReferences(toUri(refsPath), makePosition(34, 22))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(refsPath), range: makeRange(7, 13, 7, 19) },
        { uri: toUri(refsPath), range: makeRange(13, 15, 13, 21) },
        { uri: toUri(refsPath), range: makeRange(23, 8, 23, 14) },
        { uri: toUri(refsPath), range: makeRange(34, 22, 34, 28) },
      ])
    )
  })

  // Bug: also returns emit Logged(msg.sender) at User.sol 12:13, which emits the address overload.
  test.skip('overloaded event, from its declaration', async () => {
    const locations = await client.findReferences(toUri(logPath), makePosition(4, 10))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(logPath), range: makeRange(4, 10, 4, 16) },
        { uri: toUri(logPath), range: makeRange(9, 13, 9, 19) },
        { uri: toUri(userPath), range: makeRange(11, 13, 11, 19) },
        { uri: toUri(userPath), range: makeRange(27, 20, 27, 26) },
      ])
    )
  })

  // Bug: returns no locations.
  test.skip('overloaded event, from an inherited emit', async () => {
    const locations = await client.findReferences(toUri(userPath), makePosition(11, 13))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(logPath), range: makeRange(4, 10, 4, 16) },
        { uri: toUri(logPath), range: makeRange(9, 13, 9, 19) },
        { uri: toUri(userPath), range: makeRange(11, 13, 11, 19) },
        { uri: toUri(userPath), range: makeRange(27, 20, 27, 26) },
      ])
    )
  })

  // Bug: returns no locations.
  test.skip('second overloaded event, from an inherited emit', async () => {
    const locations = await client.findReferences(toUri(userPath), makePosition(12, 13))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(logPath), range: makeRange(5, 10, 5, 16) },
        { uri: toUri(userPath), range: makeRange(12, 13, 12, 19) },
      ])
    )
  })
})
