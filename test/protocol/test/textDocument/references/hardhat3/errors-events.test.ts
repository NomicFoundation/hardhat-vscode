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

describe('[hardhat3] references - errors-events', () => {
  let basePath: string
  let errorsEventsPath: string
  let logPath: string
  let userPath: string

  before(async () => {
    client = await getInitializedClient()
    basePath = getProjectPath('hardhat3/contracts/definition/errors-events/Base.sol')
    errorsEventsPath = getProjectPath('hardhat3/contracts/definition/errors-events/ErrorsEvents.sol')
    logPath = getProjectPath('hardhat3/contracts/references/errors-events/Log.sol')
    userPath = getProjectPath('hardhat3/contracts/references/errors-events/User.sol')

    await client.openDocument(basePath)
    await client.openDocument(errorsEventsPath)
    await client.openDocument(logPath)
    await client.openDocument(userPath)
  })

  after(async () => {
    await client.closeAllDocuments()
  })

  test('interface event from its declaration', async () => {
    const locations = await client.findReferences(toUri(basePath), makePosition(5, 11))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(basePath), range: makeRange(5, 10, 5, 19) },
        { uri: toUri(errorsEventsPath), range: makeRange(19, 13, 19, 22) },
        { uri: toUri(errorsEventsPath), range: makeRange(40, 22, 40, 31) },
      ])
    )
  })

  test('interface event from a qualified emit in a non-inheriting contract', async () => {
    const locations = await client.findReferences(toUri(errorsEventsPath), makePosition(40, 23))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(basePath), range: makeRange(5, 10, 5, 19) },
        { uri: toUri(errorsEventsPath), range: makeRange(19, 13, 19, 22) },
        { uri: toUri(errorsEventsPath), range: makeRange(40, 22, 40, 31) },
      ])
    )
  })

  test('inherited error from its declaration, not a same-named error elsewhere', async () => {
    const locations = await client.findReferences(toUri(logPath), makePosition(6, 11))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(logPath), range: makeRange(6, 10, 6, 16) },
        { uri: toUri(userPath), range: makeRange(10, 45, 10, 51) },
        { uri: toUri(userPath), range: makeRange(17, 32, 17, 38) },
      ])
    )
  })

  test('inherited error from its selector', async () => {
    const locations = await client.findReferences(toUri(userPath), makePosition(17, 33))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(logPath), range: makeRange(6, 10, 6, 16) },
        { uri: toUri(userPath), range: makeRange(10, 45, 10, 51) },
        { uri: toUri(userPath), range: makeRange(17, 32, 17, 38) },
      ])
    )
  })
})
