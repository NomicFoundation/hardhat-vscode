import { expect } from 'chai'
import { test } from 'mocha'
import { TextEdit, WorkspaceEdit } from 'vscode-languageserver-protocol'
import { toUri } from '../../../../src/helpers'
import { TestLanguageClient } from '../../../../src/TestLanguageClient'
import { getInitializedClient } from '../../../client'
import { getProjectPath, makePosition, makeRange } from '../../../helpers'

let client!: TestLanguageClient

// Edits within a file come in no particular order: compare them as sets.
function sorted(edit: WorkspaceEdit | null) {
  if (edit === null) {
    return null
  }
  const changes: Record<string, TextEdit[]> = {}
  for (const [uri, edits] of Object.entries(edit.changes ?? {})) {
    changes[uri] = [...edits].sort(
      (a, b) => a.range.start.line - b.range.start.line || a.range.start.character - b.range.start.character
    )
  }
  return { changes }
}

describe('[hardhat] rename - errors-events', () => {
  let basePath: string
  let errorsEventsPath: string
  let logPath: string
  let userPath: string
  let guardPath: string
  let clientPath: string

  before(async () => {
    client = await getInitializedClient()
    basePath = getProjectPath('hardhat/contracts/definition/errors-events/Base.sol')
    errorsEventsPath = getProjectPath('hardhat/contracts/definition/errors-events/ErrorsEvents.sol')
    logPath = getProjectPath('hardhat/contracts/references/errors-events/Log.sol')
    userPath = getProjectPath('hardhat/contracts/references/errors-events/User.sol')
    guardPath = getProjectPath('hardhat/contracts/rename/errors-events/Guard.sol')
    clientPath = getProjectPath('hardhat/contracts/rename/errors-events/Client.sol')

    await client.openDocument(basePath)
    await client.openDocument(errorsEventsPath)
    await client.openDocument(logPath)
    await client.openDocument(userPath)
    await client.openDocument(guardPath)
    await client.openDocument(clientPath)
  })

  async function reopen() {
    await client.closeAllDocuments()
    await client.openDocument(basePath)
    await client.openDocument(errorsEventsPath)
    await client.openDocument(logPath)
    await client.openDocument(userPath)
    await client.openDocument(guardPath)
    await client.openDocument(clientPath)
  }

  afterEach(reopen)

  after(async () => {
    await client.closeAllDocuments()
  })

  test('interface event from a qualified emit in a non-inheriting contract', async () => {
    const workspaceEdit = await client.rename(toUri(errorsEventsPath), makePosition(40, 23), 'EERNDeposited')

    expect(sorted(workspaceEdit)).to.deep.equal(
      sorted({
        changes: {
          [toUri(basePath)]: [{ range: makeRange(5, 10, 5, 19), newText: 'EERNDeposited' }],
          [toUri(errorsEventsPath)]: [
            { range: makeRange(19, 13, 19, 22), newText: 'EERNDeposited' },
            { range: makeRange(40, 22, 40, 31), newText: 'EERNDeposited' },
          ],
        },
      })
    )
  })

  test('event from its emit, leaving a same-named event in another contract', async () => {
    const workspaceEdit = await client.rename(toUri(userPath), makePosition(26, 14), 'EERNMovedOther')

    expect(sorted(workspaceEdit)).to.deep.equal(
      sorted({
        changes: {
          [toUri(userPath)]: [
            { range: makeRange(22, 10, 22, 15), newText: 'EERNMovedOther' },
            { range: makeRange(26, 13, 26, 18), newText: 'EERNMovedOther' },
          ],
        },
      })
    )
  })

  test('inherited error from its declaration, with revert and selector uses', async () => {
    const workspaceEdit = await client.rename(toUri(logPath), makePosition(6, 11), 'EERNDenied')

    expect(sorted(workspaceEdit)).to.deep.equal(
      sorted({
        changes: {
          [toUri(logPath)]: [{ range: makeRange(6, 10, 6, 16), newText: 'EERNDenied' }],
          [toUri(userPath)]: [
            { range: makeRange(10, 45, 10, 51), newText: 'EERNDenied' },
            { range: makeRange(17, 32, 17, 38), newText: 'EERNDenied' },
          ],
        },
      })
    )
  })

  test('error parameter from a named argument key', async () => {
    const workspaceEdit = await client.rename(toUri(guardPath), makePosition(10, 40), 'eerNBlockCode')

    expect(sorted(workspaceEdit)).to.deep.equal(
      sorted({
        changes: {
          [toUri(guardPath)]: [
            { range: makeRange(4, 26, 4, 30), newText: 'eerNBlockCode' },
            { range: makeRange(10, 39, 10, 43), newText: 'eerNBlockCode' },
          ],
        },
      })
    )
  })

  test('inherited state variable shadowed by a catch parameter, right only because the catch parameter is dropped', async () => {
    const workspaceEdit = await client.rename(toUri(clientPath), makePosition(15, 16), 'eerNLastReason')

    expect(sorted(workspaceEdit)).to.deep.equal(
      sorted({
        changes: {
          [toUri(guardPath)]: [
            { range: makeRange(6, 20, 6, 26), newText: 'eerNLastReason' },
            { range: makeRange(9, 8, 9, 14), newText: 'eerNLastReason' },
          ],
          [toUri(clientPath)]: [{ range: makeRange(15, 15, 15, 21), newText: 'eerNLastReason' }],
        },
      })
    )
  })

  test('built-in error in a catch clause is refused', async () => {
    const workspaceEdit = await client.rename(toUri(clientPath), makePosition(9, 17), 'EERNError').catch(() => null)

    // A refusal: no result, an error, or an edit that changes nothing.
    expect(Object.keys(workspaceEdit?.changes ?? {})).to.deep.equal([])
  })
})
